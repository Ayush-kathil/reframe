import { mapTimelineToSourceTime } from "./clipPlayback";
import { resolveActiveClip } from "@/lib/animation/resolveActiveClip";
import { getAutoReframeCropAtTime } from "@/lib/tracking/autoReframe";
import type { TrackingSample } from "@/lib/tracking/focusTracker";
import { resolveActiveTransition } from "@/lib/transitions/resolveTransition";
import type { CropRectUv } from "@/lib/tracking/autoReframe";
import type { TimelineClip, TimelineTrack } from "@/store/timelineStore";

export const FULL_FRAME_CROP: CropRectUv = { originX: 0, originY: 0, sizeX: 1, sizeY: 1 };

export type PlaybackContext =
  | {
      mode: "idle";
    }
  | {
      mode: "clip";
      clip: TimelineClip;
      sourceTime: number;
      cropRect: CropRectUv;
    }
  | {
      mode: "transition";
      leftClip: TimelineClip;
      rightClip: TimelineClip;
      progress: number;
      kind: import("@/store/timelineStore").TransitionKind;
      sourceTimeA: number;
      sourceTimeB: number;
      cropRectA: CropRectUv;
      cropRectB: CropRectUv;
    };

export function resolvePlaybackContext(
  tracks: TimelineTrack[],
  sourceUrl: string | null,
  globalTime: number,
  options: {
    autoReframeEnabled: boolean;
    trackingPath: TrackingSample[];
    sourceWidth: number;
    sourceHeight: number;
  }
): PlaybackContext {
  if (!sourceUrl) {
    return { mode: "idle" };
  }

  const transition = resolveActiveTransition(tracks, globalTime);
  if (transition) {
    const sourceTimeA = Math.max(
      transition.leftClip.inPoint,
      transition.leftClip.outPoint - transition.transition.duration * (1 - transition.progress)
    );
    const sourceTimeB = Math.min(
      transition.rightClip.outPoint,
      transition.rightClip.inPoint + transition.transition.duration * transition.progress
    );

    const cropRectA = options.autoReframeEnabled
      ? getAutoReframeCropAtTime(
          options.trackingPath,
          sourceTimeA,
          options.sourceWidth,
          options.sourceHeight
        )
      : FULL_FRAME_CROP;
    const cropRectB = options.autoReframeEnabled
      ? getAutoReframeCropAtTime(
          options.trackingPath,
          sourceTimeB,
          options.sourceWidth,
          options.sourceHeight
        )
      : FULL_FRAME_CROP;

    return {
      mode: "transition",
      leftClip: transition.leftClip,
      rightClip: transition.rightClip,
      progress: transition.progress,
      kind: transition.transition.kind,
      sourceTimeA,
      sourceTimeB,
      cropRectA,
      cropRectB,
    };
  }

  const active = resolveActiveClip(tracks, sourceUrl, globalTime);
  if (!active) {
    return { mode: "idle" };
  }

  const sourceTime = mapTimelineToSourceTime(active.clip, globalTime);
  if (sourceTime === null) {
    return { mode: "idle" };
  }

  const cropRect = options.autoReframeEnabled
    ? getAutoReframeCropAtTime(
        options.trackingPath,
        sourceTime,
        options.sourceWidth,
        options.sourceHeight
      )
    : FULL_FRAME_CROP;

  return {
    mode: "clip",
    clip: active.clip,
    sourceTime,
    cropRect,
  };
}
