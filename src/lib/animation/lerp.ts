import type { KeyframeNode } from "@/store/timelineStore";

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function sampleKeyframeTrack(nodes: KeyframeNode[] | undefined, time: number, fallback: number) {
  if (!nodes || nodes.length === 0) {
    return fallback;
  }

  const sorted = [...nodes].sort((left, right) => left.time - right.time);

  if (time <= sorted[0]!.time) {
    return sorted[0]!.value;
  }

  const last = sorted[sorted.length - 1]!;
  if (time >= last.time) {
    return last.value;
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index]!;
    const next = sorted[index + 1]!;
    if (time >= current.time && time <= next.time) {
      const span = next.time - current.time;
      if (span <= 0) {
        return next.value;
      }
      const amount = (time - current.time) / span;
      return lerp(current.value, next.value, amount);
    }
  }

  return fallback;
}
