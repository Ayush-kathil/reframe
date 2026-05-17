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
  text?: string;
  textPosition?: "top" | "center" | "bottom";
  textFontSize?: number;
  textColor?: string;
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

export const DEFAULT_RECIPE: EditRecipe = {
  preset: "vertical-9-16",
  customWidth: 1920,
  customHeight: 1080,
  framing: "fit",
  trimStart: 0,
  trimEnd: null,
  rotate: 0,
  keepAudio: true,
  speed: 1,
  quality: 23,
  format: "mp4",
  brightness: 0,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  opacity: 1,
  invert: false,
  sharpen: 0,
  noise: 0,
  vignette: 0,
  colorBalanceR: 1,
  colorBalanceG: 1,
  colorBalanceB: 1,
  flipH: false,
  flipV: false,
  volume: 1,
  text: "",
  textPosition: "center",
  textFontSize: 48,
  textColor: "#ffffff",
};

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024; // 2GB

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB
