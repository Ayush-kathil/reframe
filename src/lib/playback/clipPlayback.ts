import type { TimelineClip } from "@/store/timelineStore";

export type ClipPlaybackWindow = {
  timelineStart: number;
  timelineEnd: number;
  inPoint: number;
  outPoint: number;
};

export function getClipPlaybackWindow(clip: TimelineClip): ClipPlaybackWindow {
  return {
    timelineStart: clip.startTime,
    timelineEnd: clip.startTime + clip.duration,
    inPoint: clip.inPoint,
    outPoint: clip.outPoint,
  };
}

export function mapTimelineToSourceTime(clip: TimelineClip, globalTime: number) {
  const local = globalTime - clip.startTime;
  if (local < 0 || local > clip.duration) {
    return null;
  }
  return clip.inPoint + local;
}

export function clampSourceTimeToClip(clip: TimelineClip, sourceTime: number) {
  return Math.max(clip.inPoint, Math.min(clip.outPoint, sourceTime));
}

export function isSourceTimeInsideClip(clip: TimelineClip, sourceTime: number) {
  return sourceTime >= clip.inPoint && sourceTime <= clip.outPoint;
}

export function getNextTimelineTimeAfterClip(clip: TimelineClip) {
  return clip.startTime + clip.duration;
}
