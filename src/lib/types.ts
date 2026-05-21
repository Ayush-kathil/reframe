export const RECIPE_VERSION = 1;

export interface EditRecipe {
  version: number;
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
  panX: number;
  panY: number;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkPosition: string;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkColor: string;
  watermarkFont: string;
  captionEnabled: boolean;
  captionText: string;
  captionFont: string;
  captionSize: number;
  captionColor: string;
  captionStyle: string;
  captionPosition: string;
  captionStartTime: number;
  captionEndTime: number | null;
  transitionId: string;
  transitionDuration: number;
  transitionPlacement: string;
  audioFadeIn: number;
  audioFadeOut: number;
  audioEqualizer: string;
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

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024;

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB

export function isValidRecipe(value: unknown): value is EditRecipe {
  if (!value || typeof value !== "object") return false;
  const v = value as any;

  if (typeof v.version !== "number" || v.version !== RECIPE_VERSION) return false;
  if (typeof v.preset !== "string") return false;
  if (typeof v.customWidth !== "number" || !isFinite(v.customWidth)) return false;
  if (typeof v.customHeight !== "number" || !isFinite(v.customHeight)) return false;
  if (v.framing !== "fit" && v.framing !== "fill") return false;
  if (typeof v.trimStart !== "number" || !isFinite(v.trimStart)) return false;
  if (!(v.trimEnd === null || (typeof v.trimEnd === "number" && isFinite(v.trimEnd)))) return false;
  if (![0, 90, 180, 270].includes(v.rotate)) return false;
  if (typeof v.keepAudio !== "boolean") return false;
  if (typeof v.normalizeAudio !== "boolean") return false;
  if (typeof v.speed !== "number" || !isFinite(v.speed)) return false;
  if (typeof v.quality !== "number" || !isFinite(v.quality)) return false;
  if (!["mp4", "webm", "mkv", "gif"].includes(v.format)) return false;
  if (typeof v.stabilization !== "boolean") return false;
  if (typeof v.brightness !== "number" || !isFinite(v.brightness)) return false;
  if (typeof v.contrast !== "number" || !isFinite(v.contrast)) return false;
  if (typeof v.saturation !== "number" || !isFinite(v.saturation)) return false;
  if (typeof v.soundOnCompletion !== "boolean") return false;
  
  if (typeof v.hueRotate !== "number" || !isFinite(v.hueRotate)) return false;
  if (typeof v.sepia !== "number" || !isFinite(v.sepia)) return false;
  if (typeof v.grayscale !== "number" || !isFinite(v.grayscale)) return false;
  if (typeof v.blur !== "number" || !isFinite(v.blur)) return false;
  if (typeof v.opacity !== "number" || !isFinite(v.opacity)) return false;
  if (typeof v.invert !== "boolean") return false;
  if (typeof v.sharpen !== "number" || !isFinite(v.sharpen)) return false;
  if (typeof v.noise !== "number" || !isFinite(v.noise)) return false;
  if (typeof v.vignette !== "number" || !isFinite(v.vignette)) return false;
  if (typeof v.colorBalanceR !== "number" || !isFinite(v.colorBalanceR)) return false;
  if (typeof v.colorBalanceG !== "number" || !isFinite(v.colorBalanceG)) return false;
  if (typeof v.colorBalanceB !== "number" || !isFinite(v.colorBalanceB)) return false;
  if (typeof v.flipH !== "boolean") return false;
  if (typeof v.flipV !== "boolean") return false;
  if (typeof v.volume !== "number" || !isFinite(v.volume)) return false;

  return true;
}