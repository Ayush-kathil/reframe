"use client";

import { collectClipKeyframeMarkers } from "@/lib/animation/resolveActiveClip";
import type { TimelineClip } from "@/store/timelineStore";
import { timeToPx } from "./timelineMath";

type TimelineKeyframeMarkersProps = {
  clip: TimelineClip;
  pixelsPerSecond: number;
};

export default function TimelineKeyframeMarkers({ clip, pixelsPerSecond }: TimelineKeyframeMarkersProps) {
  const markers = collectClipKeyframeMarkers(clip);

  return (
    <>
      {markers.map((marker) => (
        <div
          key={`${marker.property}-${marker.time}-${marker.value}`}
          className="pointer-events-none absolute top-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-amber-100/80 bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.55)]"
          style={{ left: timeToPx(marker.time, pixelsPerSecond) }}
          title={`${marker.property} ${marker.value.toFixed(2)}`}
        />
      ))}
    </>
  );
}
