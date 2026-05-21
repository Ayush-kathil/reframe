import { create } from "zustand";
import { isValidVideoFile } from "@/lib/videoUpload";
import type { TrackingSample } from "@/lib/tracking/focusTracker";
import { CLIP_ANIMATION_DEFAULTS, type ClipAnimationValues } from "@/store/timelineStore";

export { CLIP_ANIMATION_DEFAULTS };
export type { ClipAnimationValues };

export type ReframeDimensions = {
  width: number;
  height: number;
};

export type ReframePosition = {
  x: number;
  y: number;
};

export type ReframeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ColorVector = {
  r: number;
  g: number;
  b: number;
};

export type MaskPoint = {
  x: number;
  y: number;
};

type EditorStore = {
  originalFile: File | null;
  currentVideoUrl: string | null;
  isVideoUploaded: boolean;
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  brightness: number;
  contrast: number;
  saturation: number;
  lift: ColorVector;
  gamma: ColorVector;
  gain: ColorVector;
  maskPenActive: boolean;
  maskPoints: MaskPoint[];
  maskClosed: boolean;
  clipTransform: ClipAnimationValues;
  sourceDimensions: ReframeDimensions;
  reframeDimensions: ReframeDimensions;
  reframePosition: ReframePosition;
  reframeBox: ReframeBox;
  autoReframeEnabled: boolean;
  trackingPath: TrackingSample[];
  setOriginalFile: (file: File | null) => void;
  setCurrentVideoUrl: (url: string | null) => void;
  setIsVideoUploaded: (isVideoUploaded: boolean) => void;
  ingestVideoFile: (file: File) => boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setDuration: (duration: number) => void;
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  setSaturation: (saturation: number) => void;
  setLift: (lift: ColorVector) => void;
  setGamma: (gamma: ColorVector) => void;
  setGain: (gain: ColorVector) => void;
  setMaskPenActive: (maskPenActive: boolean) => void;
  addMaskPoint: (point: MaskPoint) => void;
  updateMaskPoint: (index: number, point: MaskPoint) => void;
  setMaskPoints: (maskPoints: MaskPoint[]) => void;
  closeMask: () => void;
  clearMask: () => void;
  setClipTransform: (clipTransform: ClipAnimationValues) => void;
  setSourceDimensions: (dimensions: ReframeDimensions) => void;
  setReframeDimensions: (dimensions: ReframeDimensions) => void;
  setReframePosition: (position: ReframePosition) => void;
  setReframeBox: (box: ReframeBox) => void;
  setAutoReframeEnabled: (autoReframeEnabled: boolean) => void;
  setTrackingPath: (trackingPath: TrackingSample[]) => void;
  resetEditor: () => void;
};

const DEFAULT_DIMENSIONS: ReframeDimensions = {
  width: 1080,
  height: 1920,
};

const DEFAULT_LIFT: ColorVector = { r: 0, g: 0, b: 0 };
const DEFAULT_GAMMA: ColorVector = { r: 1, g: 1, b: 1 };
const DEFAULT_GAIN: ColorVector = { r: 1, g: 1, b: 1 };

function revokeBlobUrl(url: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  originalFile: null,
  currentVideoUrl: null,
  isVideoUploaded: false,
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  lift: DEFAULT_LIFT,
  gamma: DEFAULT_GAMMA,
  gain: DEFAULT_GAIN,
  maskPenActive: false,
  maskPoints: [],
  maskClosed: false,
  clipTransform: { ...CLIP_ANIMATION_DEFAULTS },
  sourceDimensions: DEFAULT_DIMENSIONS,
  reframeDimensions: DEFAULT_DIMENSIONS,
  reframePosition: { x: 0.5, y: 0.5 },
  reframeBox: { x: 0, y: 0, width: DEFAULT_DIMENSIONS.width, height: DEFAULT_DIMENSIONS.height },
  autoReframeEnabled: false,
  trackingPath: [],
  setOriginalFile: (originalFile) => set({ originalFile }),
  setCurrentVideoUrl: (url) => set({ currentVideoUrl: url }),
  setIsVideoUploaded: (isVideoUploaded) => set({ isVideoUploaded }),
  ingestVideoFile: (file) => {
    if (!isValidVideoFile(file)) {
      return false;
    }

    const state = get();
    revokeBlobUrl(state.currentVideoUrl);
    const url = URL.createObjectURL(file);
    set({
      originalFile: file,
      currentVideoUrl: url,
      isVideoUploaded: true,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    });
    return true;
  },
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setDuration: (duration) => set({ duration: Math.max(0, duration) }),
  setBrightness: (brightness) => set({ brightness }),
  setContrast: (contrast) => set({ contrast }),
  setSaturation: (saturation) => set({ saturation }),
  setLift: (lift) => set({ lift }),
  setGamma: (gamma) => set({ gamma }),
  setGain: (gain) => set({ gain }),
  setMaskPenActive: (maskPenActive) => set({ maskPenActive }),
  addMaskPoint: (point) =>
    set((state) => ({
      maskPoints: state.maskClosed ? [point] : [...state.maskPoints, point],
      maskClosed: false,
    })),
  updateMaskPoint: (index, point) =>
    set((state) => ({
      maskPoints: state.maskPoints.map((entry, entryIndex) => (entryIndex === index ? point : entry)),
    })),
  setMaskPoints: (maskPoints) => set({ maskPoints }),
  closeMask: () => set({ maskClosed: true }),
  clearMask: () => set({ maskPoints: [], maskClosed: false }),
  setClipTransform: (clipTransform) => set({ clipTransform }),
  setSourceDimensions: (sourceDimensions) => set({ sourceDimensions }),
  setReframeDimensions: (reframeDimensions) => set({ reframeDimensions }),
  setReframePosition: (reframePosition) => set({ reframePosition }),
  setReframeBox: (reframeBox) => set({ reframeBox }),
  setAutoReframeEnabled: (autoReframeEnabled) =>
    set((state) => ({
      autoReframeEnabled,
      reframeDimensions: autoReframeEnabled
        ? { width: 1080, height: 1920 }
        : state.reframeDimensions,
    })),
  setTrackingPath: (trackingPath) => set({ trackingPath }),
  resetEditor: () => {
    revokeBlobUrl(get().currentVideoUrl);
    set({
      originalFile: null,
      currentVideoUrl: null,
      isVideoUploaded: false,
      currentTime: 0,
      isPlaying: false,
      duration: 0,
      brightness: 0,
      contrast: 1,
      saturation: 1,
      lift: DEFAULT_LIFT,
      gamma: DEFAULT_GAMMA,
      gain: DEFAULT_GAIN,
      maskPenActive: false,
      maskPoints: [],
      maskClosed: false,
      clipTransform: { ...CLIP_ANIMATION_DEFAULTS },
      sourceDimensions: DEFAULT_DIMENSIONS,
      reframeDimensions: DEFAULT_DIMENSIONS,
      reframePosition: { x: 0.5, y: 0.5 },
      reframeBox: { x: 0, y: 0, width: DEFAULT_DIMENSIONS.width, height: DEFAULT_DIMENSIONS.height },
      autoReframeEnabled: false,
      trackingPath: [],
    });
  },
}));
