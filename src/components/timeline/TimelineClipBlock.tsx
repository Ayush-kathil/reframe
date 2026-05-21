"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineClip } from "@/store/timelineStore";
import { cn } from "@/lib/utils";
import { pxToTime, timeToPx } from "./timelineMath";
import TimelineKeyframeMarkers from "./TimelineKeyframeMarkers";

type MediaTrimEdge = "in" | "out";

type TimelineClipBlockProps = {
  clip: TimelineClip;
  trackId: string;
  pixelsPerSecond: number;
  locked: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (startTime: number) => void;
  onTrimMedia: (edge: MediaTrimEdge, timelineTime: number) => void;
  onDragPreview: (startTime: number) => void;
  onDragEnd: () => void;
};

type DragMode = "move" | MediaTrimEdge | null;

export default function TimelineClipBlock({
  clip,
  trackId,
  pixelsPerSecond,
  locked,
  selected,
  onSelect,
  onMove,
  onTrimMedia,
  onDragPreview,
  onDragEnd,
}: TimelineClipBlockProps) {
  const dragRef = useRef<DragMode>(null);
  const originRef = useRef({ pointerX: 0, startTime: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(timeToPx(clip.startTime, pixelsPerSecond));
  const springX = useSpring(x, { stiffness: 520, damping: 42, mass: 0.35 });

  useEffect(() => {
    if (!isDragging) {
      x.set(timeToPx(clip.startTime, pixelsPerSecond));
    }
  }, [clip.startTime, isDragging, pixelsPerSecond, x]);

  const widthPx = Math.max(28, timeToPx(clip.duration, pixelsPerSecond));

  const resolveTimelineTime = useCallback(
    (clientX: number) => {
      const container = document.querySelector("[data-timeline-scroll]");
      if (!(container instanceof HTMLElement)) return clip.startTime;
      const rect = container.getBoundingClientRect();
      const localX = clientX - rect.left + container.scrollLeft;
      return pxToTime(localX, pixelsPerSecond);
    },
    [clip.startTime, pixelsPerSecond]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, mode: DragMode) => {
      if (locked || !mode) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = mode;
      setIsDragging(true);
      originRef.current = {
        pointerX: event.clientX,
        startTime: clip.startTime,
      };
      onSelect();
    },
    [clip.startTime, locked, onSelect]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const mode = dragRef.current;
      if (!mode) return;

      const timelineTime = resolveTimelineTime(event.clientX);

      if (mode === "move") {
        const delta = pxToTime(event.clientX - originRef.current.pointerX, pixelsPerSecond);
        const previewStart = Math.max(0, originRef.current.startTime + delta);
        x.set(timeToPx(previewStart, pixelsPerSecond));
        onDragPreview(previewStart);
        return;
      }

      onTrimMedia(mode, timelineTime);
    },
    [onDragPreview, onTrimMedia, pixelsPerSecond, resolveTimelineTime, x]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const mode = dragRef.current;
      if (!mode) return;

      if (mode === "move") {
        const delta = pxToTime(event.clientX - originRef.current.pointerX, pixelsPerSecond);
        const finalStart = Math.max(0, originRef.current.startTime + delta);
        onMove(finalStart);
        x.set(timeToPx(finalStart, pixelsPerSecond));
      } else {
        onTrimMedia(mode, resolveTimelineTime(event.clientX));
      }

      dragRef.current = null;
      setIsDragging(false);
      onDragEnd();
    },
    [onDragEnd, onMove, onTrimMedia, pixelsPerSecond, resolveTimelineTime, x]
  );

  return (
    <motion.div
      data-track-id={trackId}
      data-clip-id={clip.id}
      role="group"
      aria-label={clip.label || "Timeline clip"}
      className={cn(
        "absolute top-1.5 z-10 flex h-[calc(100%-12px)] min-w-[28px] select-none overflow-hidden rounded-lg border shadow-lg",
        selected ? "border-violet-300 ring-2 ring-violet-400/50" : "border-white/15",
        locked ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing"
      )}
      style={{
        width: widthPx,
        x: isDragging ? x : springX,
        background: clip.color || "linear-gradient(135deg, rgba(139,92,246,0.92), rgba(99,102,241,0.88))",
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).dataset.trimHandle) return;
        handlePointerDown(event, "move");
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        data-trim-handle="in"
        className="absolute inset-y-0 left-0 z-20 w-3 cursor-ew-resize rounded-l-lg bg-amber-300/25 hover:bg-amber-300/45"
        onPointerDown={(event) => handlePointerDown(event, "in")}
      />
      <div
        data-trim-handle="out"
        className="absolute inset-y-0 right-0 z-20 w-3 cursor-ew-resize rounded-r-lg bg-amber-300/25 hover:bg-amber-300/45"
        onPointerDown={(event) => handlePointerDown(event, "out")}
      />
      <TimelineKeyframeMarkers clip={clip} pixelsPerSecond={pixelsPerSecond} />
      <div className="pointer-events-none flex h-full flex-col justify-between px-3 py-1.5">
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
          {clip.label || "Clip"}
        </span>
        <span className="font-mono text-[10px] text-white/70">
          {(clip.outPoint - clip.inPoint).toFixed(1)}s
        </span>
      </div>
    </motion.div>
  );
}
