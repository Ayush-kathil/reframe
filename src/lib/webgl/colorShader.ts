export const MAX_MASK_POINTS = 16;

export const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
uniform float u_scale;
uniform vec2 u_translate;

out vec2 v_uv;
out float v_outside;

void main() {
  vec2 uv = a_position * 0.5 + 0.5;
  vec2 centered = uv - 0.5;
  centered = centered / max(u_scale, 0.001);
  centered -= u_translate;
  vec2 transformed = centered + 0.5;
  v_uv = transformed;
  v_outside = 0.0;
  if (transformed.x < 0.0 || transformed.x > 1.0 || transformed.y < 0.0 || transformed.y > 1.0) {
    v_outside = 1.0;
  }
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
in float v_outside;
out vec4 outColor;

uniform sampler2D u_source;
uniform vec4 u_cropRect;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform vec3 u_lift;
uniform vec3 u_gamma;
uniform vec3 u_gain;
uniform float u_opacity;
uniform int u_maskCount;
uniform int u_maskEnabled;
uniform vec2 u_maskPoints[${MAX_MASK_POINTS}];

vec3 applySaturation(vec3 color, float saturation) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luma), color, saturation);
}

bool pointInPolygon(vec2 point, int count) {
  bool inside = false;
  int previous = count - 1;
  for (int index = 0; index < ${MAX_MASK_POINTS}; index++) {
    if (index >= count) {
      break;
    }
    vec2 current = u_maskPoints[index];
    vec2 prior = u_maskPoints[previous];
    bool intersects = ((current.y > point.y) != (prior.y > point.y))
      && (point.x < (prior.x - current.x) * (point.y - current.y) / (prior.y - current.y + 0.000001) + current.x);
    if (intersects) {
      inside = !inside;
    }
    previous = index;
  }
  return inside;
}

void main() {
  if (v_outside > 0.5) {
    outColor = vec4(0.0);
    return;
  }

  vec2 mappedUv = u_cropRect.xy + v_uv * u_cropRect.zw;
  if (mappedUv.x < 0.0 || mappedUv.x > 1.0 || mappedUv.y < 0.0 || mappedUv.y > 1.0) {
    outColor = vec4(0.0);
    return;
  }

  vec4 source = texture(u_source, mappedUv);
  vec3 color = source.rgb;

  color += vec3(u_brightness);
  color = (color - 0.5) * u_contrast + 0.5;
  color = applySaturation(color, u_saturation);
  color = (color + u_lift) * u_gain;
  color = pow(max(color, vec3(0.0)), vec3(1.0) / max(u_gamma, vec3(0.001)));

  float alpha = source.a;
  if (u_maskEnabled == 1 && u_maskCount >= 3) {
    alpha = pointInPolygon(v_uv, u_maskCount) ? 1.0 : 0.0;
  }

  outColor = vec4(color, alpha * u_opacity);
}
`;

export type ColorUniforms = {
  brightness: number;
  contrast: number;
  saturation: number;
  lift: [number, number, number];
  gamma: [number, number, number];
  gain: [number, number, number];
  scale: number;
  opacity: number;
  positionX: number;
  positionY: number;
  maskEnabled: boolean;
  maskCount: number;
  maskPoints: Array<[number, number]>;
  cropRect: [number, number, number, number];
};

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compile failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

export function createColorProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Program link failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export function getColorUniformLocations(gl: WebGL2RenderingContext, program: WebGLProgram) {
  return {
    source: gl.getUniformLocation(program, "u_source"),
    cropRect: gl.getUniformLocation(program, "u_cropRect"),
    scale: gl.getUniformLocation(program, "u_scale"),
    translate: gl.getUniformLocation(program, "u_translate"),
    opacity: gl.getUniformLocation(program, "u_opacity"),
    brightness: gl.getUniformLocation(program, "u_brightness"),
    contrast: gl.getUniformLocation(program, "u_contrast"),
    saturation: gl.getUniformLocation(program, "u_saturation"),
    lift: gl.getUniformLocation(program, "u_lift"),
    gamma: gl.getUniformLocation(program, "u_gamma"),
    gain: gl.getUniformLocation(program, "u_gain"),
    maskCount: gl.getUniformLocation(program, "u_maskCount"),
    maskEnabled: gl.getUniformLocation(program, "u_maskEnabled"),
    maskPoints: Array.from({ length: MAX_MASK_POINTS }, (_, index) =>
      gl.getUniformLocation(program, `u_maskPoints[${index}]`)
    ),
  };
}
