export function timeToPx(time: number, pixelsPerSecond: number) {
  return time * pixelsPerSecond;
}

export function pxToTime(px: number, pixelsPerSecond: number) {
  return px / Math.max(pixelsPerSecond, 1);
}

export function formatTimecode(seconds: number) {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  const frames = Math.floor((total % 1) * 30);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function buildRulerTicks(duration: number) {
  const step = duration <= 60 ? 1 : duration <= 180 ? 5 : duration <= 600 ? 10 : 30;
  const count = Math.ceil(duration / step);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}
