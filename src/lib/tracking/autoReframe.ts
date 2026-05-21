import { interpolateTracking, type TrackingSample } from "./focusTracker";

export type CropRectUv = {
  originX: number;
  originY: number;
  sizeX: number;
  sizeY: number;
};

export function computePortraitCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: number,
  centerX: number,
  centerY: number
): CropRectUv {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  const sourceAspect = safeWidth / safeHeight;

  let cropWidth = safeWidth;
  let cropHeight = safeHeight;

  if (sourceAspect > targetAspect) {
    cropWidth = safeHeight * targetAspect;
    cropHeight = safeHeight;
  } else {
    cropWidth = safeWidth;
    cropHeight = safeWidth / targetAspect;
  }

  const pixelCenterX = centerX * safeWidth;
  const pixelCenterY = centerY * safeHeight;
  const cropX = Math.max(0, Math.min(safeWidth - cropWidth, pixelCenterX - cropWidth / 2));
  const cropY = Math.max(0, Math.min(safeHeight - cropHeight, pixelCenterY - cropHeight / 2));

  return {
    originX: cropX / safeWidth,
    originY: cropY / safeHeight,
    sizeX: cropWidth / safeWidth,
    sizeY: cropHeight / safeHeight,
  };
}

export function getAutoReframeCropAtTime(
  samples: TrackingSample[],
  time: number,
  sourceWidth: number,
  sourceHeight: number,
  targetAspect = 9 / 16
): CropRectUv {
  const focus = interpolateTracking(samples, time);
  return computePortraitCropRect(sourceWidth, sourceHeight, targetAspect, focus.centerX, focus.centerY);
}
