export interface EditRecipe {
  preset: string;
  customWidth: number;
  customHeight: number;
  framing: "fit" | "fill";
  trimStart: number;
  trimEnd: number | null;
  rotate: 0 | 90 | 180 | 270;
  keepAudio: boolean;
  speed: number;
  quality: number;
  format: "mp4" | "webm" | "mkv";

  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  sepia: number;
  blur: number;
  grayscale: number;
  opacity: number;
  volume: number;
  invert: boolean;
  flipH: boolean;
  flipV: boolean;

  vignette: number;
  noise: number;
  sharpen: number;
  colorBalanceR: number;
  colorBalanceG: number;
  colorBalanceB: number;

  text: string;
  textColor: string;
  textFontSize: number;
  textPosition: "top" | "center" | "bottom";
}

export interface ExportResult {
  blobUrl: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm" | "mkv";
}

export type ExportStatus =
  | "idle"
  | "loading-engine"
  | "exporting"
  | "done"
  | "error";

export const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4] as const;

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024; // 2GB

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB
