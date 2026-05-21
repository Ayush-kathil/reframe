"use client";

import type { TimelineTransition } from "@/store/timelineStore";
import { timeToPx } from "./timelineMath";

type TimelineTransitionBlockProps = {
  transition: TimelineTransition;
  pixelsPerSecond: number;
  top: number;
  height: number;
};

const kindLabels: Record<TimelineTransition["kind"], string> = {
  "linear-fade": "Fade",
  "cross-dissolve": "Dissolve",
  "directional-slide": "Slide",
};

export default function TimelineTransitionBlock({
  transition,
  pixelsPerSecond,
  top,
  height,
}: TimelineTransitionBlockProps) {
  const widthPx = Math.max(18, timeToPx(transition.duration, pixelsPerSecond));

  return (
    <div
      className="absolute z-20 flex items-center justify-center overflow-hidden rounded-md border border-amber-200/40 bg-gradient-to-r from-amber-400/30 via-fuchsia-400/25 to-cyan-400/30 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-50 shadow-lg shadow-amber-500/20"
      style={{
        left: timeToPx(transition.startTime, pixelsPerSecond),
        width: widthPx,
        top: top + 6,
        height: height - 12,
      }}
    >
      {kindLabels[transition.kind]}
    </div>
  );
}
