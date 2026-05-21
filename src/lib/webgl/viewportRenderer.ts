import {
  ColorUniforms,
  createColorProgram,
  getColorUniformLocations,
  MAX_MASK_POINTS,
} from "./colorShader";
import {
  createCompositeProgram,
  getCompositeUniformLocations,
  transitionKindToUniform,
} from "./compositeShader";
import type { TransitionKind } from "@/store/timelineStore";
import type { CropRectUv } from "@/lib/tracking/autoReframe";

type UniformLocations = ReturnType<typeof getColorUniformLocations>;
type CompositeUniformLocations = ReturnType<typeof getCompositeUniformLocations>;

export type TransitionDrawState = {
  kind: TransitionKind;
  progress: number;
  cropRectA: CropRectUv;
  cropRectB: CropRectUv;
  sourceTimeA: number;
  sourceTimeB: number;
  opacityA: number;
  opacityB: number;
};

const FULL_FRAME_CROP: CropRectUv = { originX: 0, originY: 0, sizeX: 1, sizeY: 1 };

function cropToUniform(crop: CropRectUv): [number, number, number, number] {
  return [crop.originX, crop.originY, crop.sizeX, crop.sizeY];
}

export class ViewportRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private compositeProgram: WebGLProgram;
  private uniforms: UniformLocations;
  private compositeUniforms: CompositeUniformLocations;
  private positionBuffer: WebGLBuffer;
  private texture: WebGLTexture;
  private textureB: WebGLTexture;
  private vao: WebGLVertexArrayObject | null;
  private ready = false;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!context) {
      throw new Error("WebGL2 is not available");
    }

    this.gl = context;
    this.program = createColorProgram(this.gl);
    this.compositeProgram = createCompositeProgram(this.gl);
    this.uniforms = getColorUniformLocations(this.gl, this.program);
    this.compositeUniforms = getCompositeUniformLocations(this.gl, this.compositeProgram);
    this.positionBuffer = this.createPositionBuffer();
    this.texture = this.createTexture();
    this.textureB = this.createTexture();
    this.vao = this.gl.createVertexArray();
    this.bindGeometry(this.program);
    this.ready = true;
  }

  private createPositionBuffer() {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error("Unable to create buffer");
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      this.gl.STATIC_DRAW
    );

    return buffer;
  }

  private createTexture() {
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error("Unable to create texture");
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
  }

  private bindGeometry(program: WebGLProgram) {
    const positionLocation = this.gl.getAttribLocation(program, "a_position");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

    if (this.vao) {
      this.gl.bindVertexArray(this.vao);
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.bindVertexArray(null);
      return;
    }

    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  private uploadVideoFrame(video: HTMLVideoElement, texture: WebGLTexture) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  resize(width: number, height: number) {
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    this.gl.viewport(0, 0, safeWidth, safeHeight);
  }

  draw(video: HTMLVideoElement, uniforms: ColorUniforms) {
    if (!this.ready || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.program);
    this.uploadVideoFrame(video, this.texture);

    if (this.vao) {
      gl.bindVertexArray(this.vao);
    } else {
      this.bindGeometry(this.program);
    }

    gl.uniform1i(this.uniforms.source, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform4fv(this.uniforms.cropRect, uniforms.cropRect);
    gl.uniform1f(this.uniforms.scale, uniforms.scale);
    gl.uniform2f(this.uniforms.translate, uniforms.positionX, uniforms.positionY);
    gl.uniform1f(this.uniforms.opacity, uniforms.opacity);
    gl.uniform1f(this.uniforms.brightness, uniforms.brightness);
    gl.uniform1f(this.uniforms.contrast, uniforms.contrast);
    gl.uniform1f(this.uniforms.saturation, uniforms.saturation);
    gl.uniform3fv(this.uniforms.lift, uniforms.lift);
    gl.uniform3fv(this.uniforms.gamma, uniforms.gamma);
    gl.uniform3fv(this.uniforms.gain, uniforms.gain);
    gl.uniform1i(this.uniforms.maskEnabled, uniforms.maskEnabled ? 1 : 0);
    gl.uniform1i(this.uniforms.maskCount, uniforms.maskCount);

    for (let index = 0; index < MAX_MASK_POINTS; index += 1) {
      const location = this.uniforms.maskPoints[index];
      if (!location) continue;
      const point = uniforms.maskPoints[index] || [0, 0];
      gl.uniform2f(location, point[0], point[1]);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (this.vao) {
      gl.bindVertexArray(null);
    }
  }

  drawTransition(videoA: HTMLVideoElement, videoB: HTMLVideoElement, state: TransitionDrawState) {
    if (
      !this.ready ||
      videoA.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      videoB.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    const gl = this.gl;

    gl.useProgram(this.compositeProgram);
    this.bindGeometry(this.compositeProgram);

    if (Math.abs(videoA.currentTime - state.sourceTimeA) > 0.02) {
      videoA.currentTime = state.sourceTimeA;
    }
    if (Math.abs(videoB.currentTime - state.sourceTimeB) > 0.02) {
      videoB.currentTime = state.sourceTimeB;
    }

    this.uploadVideoFrame(videoA, this.texture);
    this.uploadVideoFrame(videoB, this.textureB);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.compositeUniforms.sourceA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textureB);
    gl.uniform1i(this.compositeUniforms.sourceB, 1);

    gl.uniform1f(this.compositeUniforms.progress, state.progress);
    gl.uniform1i(this.compositeUniforms.transitionKind, transitionKindToUniform(state.kind));
    gl.uniform4fv(this.compositeUniforms.cropRectA, cropToUniform(state.cropRectA));
    gl.uniform4fv(this.compositeUniforms.cropRectB, cropToUniform(state.cropRectB));
    gl.uniform1f(this.compositeUniforms.opacityA, state.opacityA);
    gl.uniform1f(this.compositeUniforms.opacityB, state.opacityB);
    gl.uniform1f(this.compositeUniforms.slideOffset, 0.22);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const gl = this.gl;
    if (this.vao) gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.positionBuffer);
    gl.deleteTexture(this.texture);
    gl.deleteTexture(this.textureB);
    gl.deleteProgram(this.program);
    gl.deleteProgram(this.compositeProgram);
    this.ready = false;
  }
}

export { FULL_FRAME_CROP };
