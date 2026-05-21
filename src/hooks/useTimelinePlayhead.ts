import { useCallback, useEffect, useRef } from "react";

type UseTimelinePlayheadOptions = {
  isPlaying: boolean;
  isScrubbing: boolean;
  getMediaTime: () => number;
  onTimeUpdate: (time: number) => void;
  projectDuration: number;
};

export function useTimelinePlayhead({
  isPlaying,
  isScrubbing,
  getMediaTime,
  onTimeUpdate,
  projectDuration,
}: UseTimelinePlayheadOptions) {
  const frameRef = useRef<number | null>(null);
  const lastPublishRef = useRef(0);

  const publishTime = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(projectDuration, time));
      if (Math.abs(clamped - lastPublishRef.current) < 0.0005) return;
      lastPublishRef.current = clamped;
      onTimeUpdate(clamped);
    },
    [onTimeUpdate, projectDuration]
  );

  useEffect(() => {
    const shouldTick = isPlaying || isScrubbing;
    if (!shouldTick) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const tick = () => {
      publishTime(getMediaTime());
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [getMediaTime, isPlaying, isScrubbing, publishTime]);
}
