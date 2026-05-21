import { sortClips, type TimelineClip, type TimelineTrack, type TimelineTransition } from "@/store/timelineStore";

export type ActiveTransition = {
  transition: TimelineTransition;
  progress: number;
  leftClip: TimelineClip;
  rightClip: TimelineClip;
};

export function findAdjacentClipPairs(clips: TimelineClip[]) {
  const sorted = sortClips(clips);
  const pairs: Array<{ left: TimelineClip; right: TimelineClip; junctionTime: number }> = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const left = sorted[index]!;
    const right = sorted[index + 1]!;
    const junctionTime = left.startTime + left.duration;
    if (Math.abs(right.startTime - junctionTime) < 0.05) {
      pairs.push({ left, right, junctionTime });
    }
  }

  return pairs;
}

export function resolveActiveTransition(
  tracks: TimelineTrack[],
  globalTime: number
): ActiveTransition | null {
  for (const track of tracks) {
    for (const transition of track.transitions) {
      const end = transition.startTime + transition.duration;
      if (globalTime < transition.startTime || globalTime > end) {
        continue;
      }

      const leftClip = track.clips.find((clip) => clip.id === transition.leftClipId);
      const rightClip = track.clips.find((clip) => clip.id === transition.rightClipId);
      if (!leftClip || !rightClip) {
        continue;
      }

      const progress =
        transition.duration <= 0 ? 1 : (globalTime - transition.startTime) / transition.duration;

      return {
        transition,
        progress: Math.max(0, Math.min(1, progress)),
        leftClip,
        rightClip,
      };
    }
  }

  return null;
}
