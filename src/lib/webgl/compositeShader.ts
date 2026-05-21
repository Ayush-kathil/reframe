import type { TransitionKind } from "@/store/timelineStore";
import { compileShader } from "./colorShader";

export const COMPOSITE_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const COMPOSITE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_sourceA;
uniform sampler2D u_sourceB;
uniform float u_progress;
uniform int u_transitionKind;
uniform vec4 u_cropRectA;
uniform vec4 u_cropRectB;
uniform float u_opacityA;
uniform float u_opacityB;
uniform float u_slideOffset;

vec2 mapCrop(vec2 uv, vec4 cropRect) {
  return cropRect.xy + uv * cropRect.zw;
}

vec4 sampleClip(sampler2D source, vec2 uv, vec4 cropRect, float opacity) {
  vec2 mapped = mapCrop(uv, cropRect);
  if (mapped.x < 0.0 || mapped.x > 1.0 || mapped.y < 0.0 || mapped.y > 1.0) {
    return vec4(0.0);
  }
  vec4 color = texture(source, mapped);
  return vec4(color.rgb, color.a * opacity);
}

void main() {
  vec4 colorA = sampleClip(u_sourceA, v_uv, u_cropRectA, u_opacityA);
  vec4 colorB = sampleClip(u_sourceB, v_uv, u_cropRectB, u_opacityB);
  float progress = clamp(u_progress, 0.0, 1.0);
  vec4 result = colorA;

  if (u_transitionKind == 0) {
    result = mix(colorA, colorB, progress);
  } else if (u_transitionKind == 1) {
    float blend = smoothstep(0.0, 1.0, progress);
    result = mix(colorA, colorB, blend);
  } else {
    vec2 shiftedB = v_uv + vec2(u_slideOffset * progress, 0.0);
    vec4 slideB = sampleClip(u_sourceB, shiftedB, u_cropRectB, u_opacityB);
    result = mix(colorA, slideB, progress);
  }

  outColor = result;
}
`;

export function transitionKindToUniform(kind: TransitionKind) {
  if (kind === "linear-fade") return 0;
  if (kind === "cross-dissolve") return 1;
  return 2;
}

export function createCompositeProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, COMPOSITE_VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, COMPOSITE_FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Unable to create composite program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Composite program link failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export function getCompositeUniformLocations(gl: WebGL2RenderingContext, program: WebGLProgram) {
  return {
    sourceA: gl.getUniformLocation(program, "u_sourceA"),
    sourceB: gl.getUniformLocation(program, "u_sourceB"),
    progress: gl.getUniformLocation(program, "u_progress"),
    transitionKind: gl.getUniformLocation(program, "u_transitionKind"),
    cropRectA: gl.getUniformLocation(program, "u_cropRectA"),
    cropRectB: gl.getUniformLocation(program, "u_cropRectB"),
    opacityA: gl.getUniformLocation(program, "u_opacityA"),
    opacityB: gl.getUniformLocation(program, "u_opacityB"),
    slideOffset: gl.getUniformLocation(program, "u_slideOffset"),
  };
}
