"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import TimelineClipBlock from "./TimelineClipBlock";
import TimelinePlayhead from "./TimelinePlayhead";
import TimelineRuler from "./TimelineRuler";
import TimelineTransitionBlock from "./TimelineTransitionBlock";
import TimelineTransitionDropZone from "./TimelineTransitionDropZone";
import { timeToPx } from "./timelineMath";
import { useTimelinePlayhead } from "@/hooks/useTimelinePlayhead";
import { useTimelineVirtualRange } from "@/hooks/useTimelineVirtualRange";
import { cn } from "@/lib/utils";
import {
  getProjectDuration,
  sortClips,
  useTimelineStore,
  type TimelineClip,
  type TimelineTransition,
  type TransitionKind,
} from "@/store/timelineStore";
import { useEditorStore } from "@/store/editorStore";

const TRACK_HEIGHT = 56;
const TRACK_LABEL_WIDTH = 112;

type MultiTrackTimelineProps = {
  className?: string;
};

export default function MultiTrackTimeline({ className }: MultiTrackTimelineProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbingPlayhead, setIsScrubbingPlayhead] = useState(false);
  const [dragPreviewTime, setDragPreviewTime] = useState<number | null>(null);

  const {
    tracks,
    selectedClipId,
    pixelsPerSecond,
    scrollOffsetX,
    viewportWidth,
    snapGuideTime,
    addTrack,
    moveClip,
    trimClipMedia,
    insertTransition,
    setSelectedClipId,
    setPixelsPerSecond,
    setScrollOffsetX,
    setViewportWidth,
    setSnapGuideTime,
  } = useTimelineStore();

  const { currentTime, isPlaying, duration, currentVideoUrl, setCurrentTime, setDuration } = useEditorStore();

  const projectDuration = useMemo(() => getProjectDuration(tracks), [tracks]);
  const timelineDuration = Math.max(projectDuration, duration || 0, 8);
  const contentWidth = Math.max(viewportWidth, timeToPx(timelineDuration, pixelsPerSecond) + 160);

  useEffect(() => {
    if (duration <= 0 && projectDuration > 0) {
      setDuration(projectDuration);
    }
  }, [duration, projectDuration, setDuration]);


  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const updateViewport = () => {
      setViewportWidth(node.clientWidth - TRACK_LABEL_WIDTH);
      setScrollOffsetX(node.scrollLeft);
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(node);
    node.addEventListener("scroll", updateViewport, { passive: true });

    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", updateViewport);
    };
  }, [setScrollOffsetX, setViewportWidth]);

  const getMediaTime = useCallback(() => useEditorStore.getState().currentTime, []);

  useTimelinePlayhead({
    isPlaying,
    isScrubbing: isScrubbingPlayhead,
    getMediaTime,
    onTimeUpdate: setCurrentTime,
    projectDuration: timelineDuration,
  });

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const node = scrollRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const localX = clientX - rect.left + node.scrollLeft - TRACK_LABEL_WIDTH;
      const time = Math.max(0, Math.min(timelineDuration, localX / pixelsPerSecond));
      setCurrentTime(time);
    },
    [pixelsPerSecond, setCurrentTime, timelineDuration]
  );

  const handlePlayheadScrubStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsScrubbingPlayhead(true);
      seekFromClientX(event.clientX);
    },
    [seekFromClientX]
  );

  const handlePlayheadScrubMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingPlayhead) return;
      seekFromClientX(event.clientX);
    },
    [isScrubbingPlayhead, seekFromClientX]
  );

  const handlePlayheadScrubEnd = useCallback(() => {
    setIsScrubbingPlayhead(false);
  }, []);

  const handleRulerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("[data-clip-id]")) return;
      seekFromClientX(event.clientX);
      setIsScrubbingPlayhead(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [seekFromClientX]
  );

  const handleRulerPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingPlayhead) return;
      seekFromClientX(event.clientX);
    },
    [isScrubbingPlayhead, seekFromClientX]
  );

  const handleRulerPointerUp = useCallback(() => {
    setIsScrubbingPlayhead(false);
  }, []);

  const playheadTime = dragPreviewTime ?? currentTime;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addTrack()}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-200 transition hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Track
          </button>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:inline">
            Alt + trim = ripple
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setPixelsPerSecond(pixelsPerSecond - 12)}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setPixelsPerSecond(pixelsPerSecond + 12)}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div
          ref={scrollRef}
          data-timeline-scroll
          className="relative max-h-[280px] overflow-auto"
          onScroll={(event) => setScrollOffsetX(event.currentTarget.scrollLeft)}
        >
          <div className="sticky top-0 z-30 flex bg-background/95 backdrop-blur-sm">
            <div
              className="sticky left-0 z-40 shrink-0 border-r border-white/10 bg-background/95"
              style={{ width: TRACK_LABEL_WIDTH }}
            />
            <div
              className="relative"
              style={{ width: contentWidth, marginLeft: 0 }}
              onPointerDown={handleRulerPointerDown}
              onPointerMove={handleRulerPointerMove}
              onPointerUp={handleRulerPointerUp}
              onPointerCancel={handleRulerPointerUp}
            >
              <TimelineRuler duration={timelineDuration} pixelsPerSecond={pixelsPerSecond} contentWidth={contentWidth} />
            </div>
          </div>

          <div className="relative flex min-h-full min-w-full">
            <div className="sticky left-0 z-20 shrink-0 border-r border-white/10 bg-background/80 backdrop-blur-xl" style={{ width: TRACK_LABEL_WIDTH }}>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center border-b border-white/5 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <span className="truncate">{track.name}</span>
                </div>
              ))}
            </div>

            <div className="relative" style={{ width: contentWidth, height: tracks.length * TRACK_HEIGHT }}>
              <TimelineGrid duration={timelineDuration} pixelsPerSecond={pixelsPerSecond} />

              {tracks.map((track, trackIndex) => (
                <TimelineTrackLane
                  key={track.id}
                  trackId={track.id}
                  top={trackIndex * TRACK_HEIGHT}
                  clips={track.clips}
                  locked={track.locked}
                  height={TRACK_HEIGHT}
                  pixelsPerSecond={pixelsPerSecond}
                  scrollOffsetX={scrollOffsetX}
                  viewportWidth={viewportWidth}
                  selectedClipId={selectedClipId}
                  onSelectClip={setSelectedClipId}
                  onMoveClip={(clipId, startTime) => moveClip(track.id, clipId, startTime)}
                  transitions={track.transitions}
                  onTrimClipMedia={(clipId, edge, time) => trimClipMedia(track.id, clipId, edge, time)}
                  onInsertTransition={(leftId, rightId, kind) =>
                    insertTransition(track.id, leftId, rightId, kind)
                  }
                  onDragPreview={setDragPreviewTime}
                  onDragEnd={() => {
                    setDragPreviewTime(null);
                    setSnapGuideTime(null);
                  }}
                />
              ))}

              <AnimatePresence>
                {snapGuideTime !== null && (
                  <motion.div
                    key={snapGuideTime}
                    initial={{ opacity: 0, scaleY: 0.6 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0.6 }}
                    transition={{ duration: 0.12 }}
                    className="pointer-events-none absolute inset-y-0 z-30 w-px bg-cyan-300/80"
                    style={{ left: timeToPx(snapGuideTime, pixelsPerSecond) }}
                  />
                )}
              </AnimatePresence>

              <TimelinePlayhead
                currentTime={playheadTime}
                pixelsPerSecond={pixelsPerSecond}
                height={tracks.length * TRACK_HEIGHT + 32}
                scrubbing={isScrubbingPlayhead}
                onScrubStart={handlePlayheadScrubStart}
                onScrubMove={handlePlayheadScrubMove}
                onScrubEnd={handlePlayheadScrubEnd}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineGrid({ duration, pixelsPerSecond }: { duration: number; pixelsPerSecond: number }) {
  const step = duration <= 60 ? 1 : 5;
  const count = Math.ceil(duration / step);

  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: count + 1 }, (_, index) => {
        const tick = index * step;
        return (
          <div
            key={tick}
            className="absolute inset-y-0 w-px bg-white/[0.04]"
            style={{ left: timeToPx(tick, pixelsPerSecond) }}
          />
        );
      })}
    </div>
  );
}

type TimelineTrackLaneProps = {
  trackId: string;
  top: number;
  clips: TimelineClip[];
  locked: boolean;
  height: number;
  pixelsPerSecond: number;
  scrollOffsetX: number;
  viewportWidth: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  onMoveClip: (clipId: string, startTime: number) => void;
  transitions: TimelineTransition[];
  onTrimClipMedia: (clipId: string, edge: "in" | "out", time: number) => void;
  onInsertTransition: (leftClipId: string, rightClipId: string, kind: TransitionKind) => void;
  onDragPreview: (time: number | null) => void;
  onDragEnd: () => void;
};

function TimelineTrackLane({
  trackId,
  top,
  clips,
  transitions,
  locked,
  height,
  pixelsPerSecond,
  scrollOffsetX,
  viewportWidth,
  selectedClipId,
  onSelectClip,
  onMoveClip,
  onTrimClipMedia,
  onInsertTransition,
  onDragPreview,
  onDragEnd,
}: TimelineTrackLaneProps) {
  const sortedClips = useMemo(() => sortClips(clips), [clips]);
  const { visibleClips } = useTimelineVirtualRange(sortedClips, scrollOffsetX, viewportWidth, pixelsPerSecond);

  return (
    <div className="absolute inset-x-0 border-b border-white/5" style={{ top, height }}>
      {visibleClips.map((clip) => (
        <TimelineClipBlock
          key={clip.id}
          clip={clip}
          trackId={trackId}
          pixelsPerSecond={pixelsPerSecond}
          locked={locked}
          selected={selectedClipId === clip.id}
          onSelect={() => onSelectClip(clip.id)}
          onMove={(startTime) => onMoveClip(clip.id, startTime)}
          onTrimMedia={(edge, time) => onTrimClipMedia(clip.id, edge, time)}
          onDragPreview={onDragPreview}
          onDragEnd={onDragEnd}
        />
      ))}
      {transitions.map((transition) => (
        <TimelineTransitionBlock
          key={transition.id}
          transition={transition}
          pixelsPerSecond={pixelsPerSecond}
          top={0}
          height={height}
        />
      ))}
      <TimelineTransitionDropZone
        clips={sortedClips}
        pixelsPerSecond={pixelsPerSecond}
        top={0}
        height={height}
        onInsert={onInsertTransition}
      />
    </div>
  );
}
