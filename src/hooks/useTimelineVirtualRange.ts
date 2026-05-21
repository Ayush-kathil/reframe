import { useMemo } from "react";
import type { TimelineClip } from "@/store/timelineStore";

const VISIBILITY_PADDING_SECONDS = 1.5;

export function getVisibleTimeWindow(scrollOffsetX: number, viewportWidth: number, pixelsPerSecond: number) {
  const safePps = Math.max(pixelsPerSecond, 1);
  const start = scrollOffsetX / safePps - VISIBILITY_PADDING_SECONDS;
  const end = (scrollOffsetX + Math.max(viewportWidth, 1)) / safePps + VISIBILITY_PADDING_SECONDS;
  return { start: Math.max(0, start), end };
}

export function clipIntersectsWindow(clip: TimelineClip, windowStart: number, windowEnd: number) {
  const clipEnd = clip.startTime + clip.duration;
  return clipEnd >= windowStart && clip.startTime <= windowEnd;
}

export function useTimelineVirtualRange(
  clips: TimelineClip[],
  scrollOffsetX: number,
  viewportWidth: number,
  pixelsPerSecond: number
) {
  const visibleWindow = useMemo(
    () => getVisibleTimeWindow(scrollOffsetX, viewportWidth, pixelsPerSecond),
    [pixelsPerSecond, scrollOffsetX, viewportWidth]
  );

  const visibleClips = useMemo(
    () => clips.filter((clip) => clipIntersectsWindow(clip, visibleWindow.start, visibleWindow.end)),
    [clips, visibleWindow.end, visibleWindow.start]
  );

  const visibleClipIds = useMemo(() => new Set(visibleClips.map((clip) => clip.id)), [visibleClips]);

  return { visibleWindow, visibleClips, visibleClipIds };
}
