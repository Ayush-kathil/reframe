export interface EditRecipe {
  preset: string;
  customWidth: number;
  customHeight: number;
  framing: "fit" | "fill";
  trimStart: number;
  trimEnd: number | null;
  rotate: number;
  keepAudio: boolean;
  normalizeAudio: boolean;
  speed: number;
  quality: number;
  format: "mp4" | "webm" | "mkv" | "gif";
  stabilization: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  soundOnCompletion: boolean;
  hueRotate: number;
  sepia: number;
  grayscale: number;
  blur: number;
  opacity: number;
  invert: boolean;
  sharpen: number;
  noise: number;
  vignette: number;
  colorBalanceR: number;
  colorBalanceG: number;
  colorBalanceB: number;
  flipH: boolean;
  flipV: boolean;
  volume: number;
}

export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ImageOverlayOptions {
  file: File | null;
  position: OverlayPosition;
  size: number;
  opacity: number;
}

export interface BackgroundMusicOptions {
  file: File | null;
  musicVolume: number;
  originalAudioVolume: number;
  loopMusic: boolean;
}

export interface ExportResult {
  blobUrl: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm" | "mkv" | "gif";
}

export type ExportStatus =
  | "idle"
  | "loading-engine"
  | "exporting"
  | "done"
  | "error";

export const SPEED_STEPS = [
  0.25,
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  2,
  4,
] as const;

export const DEFAULT_RECIPE: EditRecipe = {
  preset: "vertical-9-16",
  customWidth: 1920,
  customHeight: 1080,
  framing: "fit",
  trimStart: 0,
  trimEnd: null,
  rotate: 0,
  keepAudio: true,
  normalizeAudio: false,
  speed: 1,
  quality: 23,
  format: "mp4",
  stabilization: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  soundOnCompletion: false,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  invert: false,
  sharpen: 0,
  noise: 0,
  vignette: 0,
  colorBalanceR: 0,
  colorBalanceG: 0,
  colorBalanceB: 0,
  flipH: false,
  flipV: false,
  volume: 1,
};

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024;

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB