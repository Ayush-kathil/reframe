"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Video } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useTimelineStore } from "@/store/timelineStore";
import TextOverlayCanvas from "./TextOverlayCanvas";

type CanvasBounds = {
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

type PointerState = {
  isDragging: boolean;
  startClientX: number;
  startClientY: number;
  startPosition: { x: number; y: number };
};

type VideoCanvasProps = {
  tool: "media" | "text" | "reframe" | "adjustments";
};

const DEFAULT_BOUNDS: CanvasBounds = {
  displayWidth: 0,
  displayHeight: 0,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function VideoCanvas({ tool }: VideoCanvasProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<PointerState>({
    isDragging: false,
    startClientX: 0,
    startClientY: 0,
    startPosition: { x: 0.5, y: 0.5 },
  });

  const [naturalSize, setNaturalSize] = useState({ width: 1920, height: 1080 });
  const [bounds, setBounds] = useState<CanvasBounds>(DEFAULT_BOUNDS);

  const {
    currentVideoUrl,
    currentTime,
    isPlaying,
    duration,
    brightness,
    contrast,
    reframeDimensions,
    reframePosition,
    setCurrentTime,
    setIsPlaying,
    setDuration,
    setSourceDimensions,
    setReframePosition,
    setReframeBox,
  } = useEditorStore();

  const aspectRatio = 16 / 9;

  const boxStyle = useMemo(() => {
    const baseWidth = reframeDimensions.width;
    const baseHeight = reframeDimensions.height;
    const sourceRatio = naturalSize.width / naturalSize.height;
    const targetRatio = baseWidth / baseHeight;

    let boxWidth = naturalSize.width;
    let boxHeight = naturalSize.height;

    if (targetRatio > sourceRatio) {
      boxWidth = naturalSize.width;
      boxHeight = boxWidth / targetRatio;
    } else {
      boxHeight = naturalSize.height;
      boxWidth = boxHeight * targetRatio;
    }

    return { boxWidth, boxHeight };
  }, [naturalSize.height, naturalSize.width, reframeDimensions.height, reframeDimensions.width]);

  const measureBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scale = Math.min(rect.width / naturalSize.width, rect.height / naturalSize.height);
    const displayWidth = naturalSize.width * scale;
    const displayHeight = naturalSize.height * scale;
    const offsetX = (rect.width - displayWidth) / 2;
    const offsetY = (rect.height - displayHeight) / 2;

    setBounds({ displayWidth, displayHeight, offsetX, offsetY, scale });
  }, [naturalSize.height, naturalSize.width]);

  useEffect(() => {
    measureBounds();
    const observer = new ResizeObserver(() => measureBounds());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [measureBounds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    if (Math.abs(video.currentTime - currentTime) > 0.05) {
      video.currentTime = currentTime;
    }
    video.muted = true;

    if (isPlaying) {
      void video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [currentTime, currentVideoUrl, isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = renderCanvasRef.current;
    if (!video || !canvas || !currentVideoUrl) return;

    let frame = 0;
    const tick = () => {
      if (isPlaying) {
        setCurrentTime(video.currentTime || 0);
      }

      if (video.readyState >= 2) {
        const maxWidth = 1920;
        const maxHeight = 1080;
        const ratio = video.videoWidth / video.videoHeight;
        
        let targetW = video.videoWidth;
        let targetH = video.videoHeight;

        if (targetW > maxWidth || targetH > maxHeight) {
          if (targetW / maxWidth > targetH / maxHeight) {
            targetW = maxWidth;
            targetH = maxWidth / ratio;
          } else {
            targetH = maxHeight;
            targetW = maxHeight * ratio;
          }
        }

        const finalW = Math.max(1, Math.round(targetW));
        const finalH = Math.max(1, Math.round(targetH));

        if (canvas.width !== finalW) canvas.width = finalW;
        if (canvas.height !== finalH) canvas.height = finalH;

        const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, finalW, finalH);
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, setCurrentTime, currentVideoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const nextWidth = video.videoWidth || 1920;
      const nextHeight = video.videoHeight || 1080;
      const mediaDuration = Number.isFinite(video.duration) ? video.duration || 0 : 0;
      setNaturalSize({ width: nextWidth, height: nextHeight });
      setSourceDimensions({ width: nextWidth, height: nextHeight });
      setDuration(mediaDuration);
      if (currentVideoUrl && mediaDuration > 0) {
        const timelineState = useTimelineStore.getState();
        const hasClips = timelineState.tracks.some((track) => track.clips.length > 0);
        if (hasClips) {
          timelineState.syncSourceDuration(currentVideoUrl, mediaDuration);
        } else {
          timelineState.replaceProjectFromMedia(currentVideoUrl, mediaDuration);
        }
      }
      measureBounds();
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [measureBounds, setCurrentTime, setDuration, setIsPlaying, setSourceDimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!currentVideoUrl) {
      return;
    }

    const { boxWidth, boxHeight } = boxStyle;
    const sourceCenterX = naturalSize.width * reframePosition.x;
    const sourceCenterY = naturalSize.height * reframePosition.y;
    const boxX = clamp(sourceCenterX - boxWidth / 2, 0, Math.max(0, naturalSize.width - boxWidth));
    const boxY = clamp(sourceCenterY - boxHeight / 2, 0, Math.max(0, naturalSize.height - boxHeight));

    setReframeBox({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
    });

    if (tool !== "reframe") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.displayWidth));
    const height = Math.max(1, Math.round(bounds.displayHeight));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const displayX = bounds.offsetX + boxX * bounds.scale;
    const displayY = bounds.offsetY + boxY * bounds.scale;
    const displayBoxWidth = boxWidth * bounds.scale;
    const displayBoxHeight = boxHeight * bounds.scale;

    ctx.save();
    ctx.fillStyle = "rgba(9, 9, 11, 0.48)";
    ctx.fillRect(0, 0, width, height);
    ctx.clearRect(displayX, displayY, displayBoxWidth, displayBoxHeight);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.96)";
    ctx.fillStyle = "rgba(139, 92, 246, 0.10)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.fillRect(displayX, displayY, displayBoxWidth, displayBoxHeight);
    ctx.strokeRect(displayX, displayY, displayBoxWidth, displayBoxHeight);
    ctx.setLineDash([]);

    const handleSize = 12;
    const handleX = displayX + displayBoxWidth - handleSize - 2;
    const handleY = displayY + displayBoxHeight - handleSize - 2;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 1;
    ctx.fillRect(handleX, handleY, handleSize, handleSize);
    ctx.strokeRect(handleX, handleY, handleSize, handleSize);
    ctx.restore();
  }, [bounds, boxStyle, currentVideoUrl, naturalSize.height, naturalSize.width, reframePosition, setReframeBox, tool]);

  const startDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool !== "reframe" || !currentVideoUrl) return;

    const { boxWidth, boxHeight } = boxStyle;
    const sourceCenterX = naturalSize.width * reframePosition.x;
    const sourceCenterY = naturalSize.height * reframePosition.y;
    const boxX = clamp(sourceCenterX - boxWidth / 2, 0, Math.max(0, naturalSize.width - boxWidth));
    const boxY = clamp(sourceCenterY - boxHeight / 2, 0, Math.max(0, naturalSize.height - boxHeight));

    const displayX = bounds.offsetX + boxX * bounds.scale;
    const displayY = bounds.offsetY + boxY * bounds.scale;
    const displayBoxWidth = boxWidth * bounds.scale;
    const displayBoxHeight = boxHeight * bounds.scale;

    const withinHandle =
      event.clientX >= displayX + displayBoxWidth - 24 &&
      event.clientY >= displayY + displayBoxHeight - 24;

    pointerRef.current = {
      isDragging: true,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: { x: reframePosition.x, y: reframePosition.y },
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!pointerRef.current.isDragging) return;

      const deltaX = (moveEvent.clientX - pointerRef.current.startClientX) / bounds.scale;
      const deltaY = (moveEvent.clientY - pointerRef.current.startClientY) / bounds.scale;

      const nextCenterX = clamp(
        pointerRef.current.startPosition.x * naturalSize.width + deltaX,
        boxWidth / 2,
        naturalSize.width - boxWidth / 2
      );
      const nextCenterY = clamp(
        pointerRef.current.startPosition.y * naturalSize.height + deltaY,
        boxHeight / 2,
        naturalSize.height - boxHeight / 2
      );

      if (withinHandle) {
        const normalizedX = clamp(nextCenterX / naturalSize.width, 0, 1);
        const normalizedY = clamp(nextCenterY / naturalSize.height, 0, 1);
        setReframePosition({ x: normalizedX, y: normalizedY });
        return;
      }

      setReframePosition({
        x: nextCenterX / naturalSize.width,
        y: nextCenterY / naturalSize.height,
      });
    };

    const stopDrag = () => {
      pointerRef.current.isDragging = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
  };

  const timeLabel = duration > 0 ? `${currentTime.toFixed(1)} / ${duration.toFixed(1)}s` : `${currentTime.toFixed(1)}s`;

  const cssFilters = `brightness(${1 + brightness}) contrast(${contrast})`;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/5 bg-zinc-950/70">
      <div ref={containerRef} className="relative h-full w-full">
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-md">
          {timeLabel}
        </div>

        <div className="relative h-full w-full" style={{ aspectRatio }}>
          {currentVideoUrl ? (
            <>
              <video
                ref={videoRef}
                src={currentVideoUrl}
                className="hidden"
                playsInline
                muted
              />
              <canvas
                ref={renderCanvasRef}
                className="h-full w-full object-contain"
                style={{ filter: cssFilters }}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_40%),linear-gradient(145deg,rgba(24,24,27,1),rgba(9,9,11,1))] text-zinc-400">
              <div className="rounded-full border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <Video className="h-8 w-8" />
              </div>
            </div>
          )}

          {tool === "reframe" && currentVideoUrl && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full z-40"
              onPointerDown={startDrag}
            />
          )}

          {currentVideoUrl && (
            <TextOverlayCanvas
              bounds={bounds}
              naturalSize={naturalSize}
              isActive={tool === "text"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
