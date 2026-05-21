"use client";

import { Pause, Play } from "lucide-react";
import { useMemo } from "react";
import TimelineClipBlock from "./TimelineClipBlock";
import TimelinePlayhead from "./TimelinePlayhead";
import TimelineRuler from "./TimelineRuler";
import { timeToPx } from "./timelineMath";
import { useTimelinePlayhead } from "@/hooks/useTimelinePlayhead";
import { cn } from "@/lib/utils";
import { getProjectDuration, sortClips, useTimelineStore } from "@/store/timelineStore";
import { useEditorStore } from "@/store/editorStore";

const TRACK_HEIGHT = 44;
type CompactTimelineProps = {
  className?: string;
};

export default function CompactTimeline({ className }: CompactTimelineProps) {
  const tracks = useTimelineStore((state) => state.tracks);
  const selectedClipId = useTimelineStore((state) => state.selectedClipId);
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const moveClip = useTimelineStore((state) => state.moveClip);
  const trimClipMedia = useTimelineStore((state) => state.trimClipMedia);
  const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);

  const { currentTime, isPlaying, duration, currentVideoUrl, setCurrentTime, togglePlayback } = useEditorStore();

  const primaryTrack = tracks[0];
  const clips = useMemo(() => sortClips(primaryTrack?.clips || []), [primaryTrack?.clips]);
  const projectDuration = useMemo(() => getProjectDuration(tracks), [tracks]);
  const timelineDuration = Math.max(projectDuration, duration || 0, 8);
  const contentWidth = timeToPx(timelineDuration, pixelsPerSecond) + 80;

  const getMediaTime = () => useEditorStore.getState().currentTime;

  useTimelinePlayhead({
    isPlaying,
    isScrubbing: false,
    getMediaTime,
    onTimeUpdate: setCurrentTime,
    projectDuration: timelineDuration,
  });

  const seekFromOffset = (offsetX: number, width: number) => {
    const time = Math.max(0, Math.min(timelineDuration, (offsetX / width) * timelineDuration));
    setCurrentTime(time);
  };

  if (!primaryTrack) {
    return null;
  }

  return (
    <div className={cn("rounded-2xl border border-white/5 bg-zinc-900/80", className)}>
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs text-zinc-400">
        <span>Timeline</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 text-zinc-200"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <span className="font-mono text-zinc-200">
            {currentTime.toFixed(1)}s / {duration > 0 ? `${duration.toFixed(1)}s` : "--"}
          </span>
        </div>
      </div>

      <div
        className="relative overflow-x-auto overscroll-x-contain"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          seekFromOffset(event.clientX - rect.left + event.currentTarget.scrollLeft, contentWidth);
        }}
      >
        <div className="relative" style={{ width: contentWidth, height: TRACK_HEIGHT + 32 }}>
          <TimelineRuler duration={timelineDuration} pixelsPerSecond={pixelsPerSecond} contentWidth={contentWidth} />
          <div className="relative" style={{ height: TRACK_HEIGHT }}>
            {clips.map((clip) => (
              <TimelineClipBlock
                key={clip.id}
                clip={clip}
                trackId={primaryTrack.id}
                pixelsPerSecond={pixelsPerSecond}
                locked={primaryTrack.locked}
                selected={selectedClipId === clip.id}
                onSelect={() => setSelectedClipId(clip.id)}
                onMove={(startTime) => moveClip(primaryTrack.id, clip.id, startTime)}
                onTrimMedia={(edge, time) => trimClipMedia(primaryTrack.id, clip.id, edge, time)}
                onDragPreview={() => undefined}
                onDragEnd={() => undefined}
              />
            ))}
            {currentVideoUrl && (
              <TimelinePlayhead
                currentTime={currentTime}
                pixelsPerSecond={pixelsPerSecond}
                height={TRACK_HEIGHT}
                scrubbing={false}
                onScrubStart={() => undefined}
                onScrubMove={() => undefined}
                onScrubEnd={() => undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
