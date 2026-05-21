import type { TimelineClip, TimelineTrack } from "@/store/timelineStore";

export function resolveActiveClip(tracks: TimelineTrack[], sourceUrl: string | null, globalTime: number) {
  if (!sourceUrl) {
    return null;
  }

  for (const track of tracks) {
    for (const clip of track.clips) {
      if (clip.sourceUrl !== sourceUrl) continue;
      const clipEnd = clip.startTime + clip.duration;
      if (globalTime >= clip.startTime && globalTime < clipEnd) {
        return { clip, trackId: track.id };
      }
    }
  }

  return null;
}

export function collectClipKeyframeMarkers(clip: TimelineClip) {
  const entries: Array<{ property: string; time: number; value: number }> = [];
  const keyframes = clip.keyframes || {};

  for (const [property, nodes] of Object.entries(keyframes)) {
    if (!nodes) continue;
    for (const node of nodes) {
      entries.push({ property, time: node.time, value: node.value });
    }
  }

  return entries;
}
