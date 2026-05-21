import { sampleKeyframeTrack } from "./lerp";
import {
  CLIP_ANIMATION_DEFAULTS,
  type ClipAnimationValues,
  type ClipKeyframes,
  type KeyframeProperty,
} from "@/store/timelineStore";

const PROPERTIES: KeyframeProperty[] = ["scale", "opacity", "positionX", "positionY"];

export function sampleClipAnimation(keyframes: ClipKeyframes | undefined, localTime: number): ClipAnimationValues {
  const result = { ...CLIP_ANIMATION_DEFAULTS };

  for (const property of PROPERTIES) {
    result[property] = sampleKeyframeTrack(keyframes?.[property], localTime, CLIP_ANIMATION_DEFAULTS[property]);
  }

  return result;
}
