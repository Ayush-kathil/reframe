"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Video } from "lucide-react";
import MaskPenOverlay from "./MaskPenOverlay";
import { ViewportRenderer } from "@/lib/webgl/viewportRenderer";
import { MAX_MASK_POINTS } from "@/lib/webgl/colorShader";
import { sampleClipAnimation } from "@/lib/animation/sampleClipAnimation";
import { resolvePlaybackContext } from "@/lib/playback/resolvePlayback";
import { buildMockTrackingPath, buildTrackingPathFromVideo } from "@/lib/tracking/focusTracker";
import { useEditorStore } from "@/store/editorStore";
import { CLIP_ANIMATION_DEFAULTS } from "@/store/timelineStore";
import { useTimelineStore } from "@/store/timelineStore";

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

type LiveViewportProps = {
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

export default function LiveViewport({ tool }: LiveViewportProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transitionVideoRef = useRef<HTMLVideoElement | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const reframeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
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
    saturation,
    lift,
    gamma,
    gain,
    maskPenActive,
    maskPoints,
    maskClosed,
    reframeDimensions,
    reframePosition,
    autoReframeEnabled,
    trackingPath,
    setTrackingPath,
    setCurrentTime,
    setIsPlaying,
    setDuration,
    setSourceDimensions,
    setReframePosition,
    setReframeBox,
    addMaskPoint,
    setClipTransform,
  } = useEditorStore();

  const transformRef = useRef(CLIP_ANIMATION_DEFAULTS);

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

  const buildColorUniforms = useCallback(
    (transform: typeof CLIP_ANIMATION_DEFAULTS, cropRect: [number, number, number, number]) => ({
      brightness,
      contrast,
      saturation,
      lift: [lift.r, lift.g, lift.b] as [number, number, number],
      gamma: [gamma.r, gamma.g, gamma.b] as [number, number, number],
      gain: [gain.r, gain.g, gain.b] as [number, number, number],
      maskEnabled: maskClosed && maskPoints.length >= 3,
      maskCount: Math.min(maskPoints.length, MAX_MASK_POINTS),
      maskPoints: maskPoints
        .slice(0, MAX_MASK_POINTS)
        .map((point) => [point.x, 1 - point.y] as [number, number]),
      scale: transform.scale,
      opacity: transform.opacity,
      positionX: transform.positionX,
      positionY: transform.positionY,
      cropRect,
    }),
    [brightness, contrast, gain, gamma, lift, maskClosed, maskPoints, saturation]
  );

  const cropToUniform = useCallback(
    (crop: { originX: number; originY: number; sizeX: number; sizeY: number }) =>
      [crop.originX, crop.originY, crop.sizeX, crop.sizeY] as [number, number, number, number],
    []
  );

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const renderer = rendererRef.current;
    const canvas = glCanvasRef.current;
    if (!video || !renderer || !canvas || !currentVideoUrl) return;

    const editorState = useEditorStore.getState();
    const playbackTime = editorState.currentTime;
    const tracks = useTimelineStore.getState().tracks;
    const playback = resolvePlaybackContext(tracks, currentVideoUrl, playbackTime, {
      autoReframeEnabled: editorState.autoReframeEnabled,
      trackingPath: editorState.trackingPath,
      sourceWidth: naturalSize.width,
      sourceHeight: naturalSize.height,
    });

    if (playback.mode === "clip") {
      if (Math.abs(video.currentTime - playback.sourceTime) > 0.03) {
        video.currentTime = playback.sourceTime;
      }
      const transform = sampleClipAnimation(
        playback.clip.keyframes,
        Math.max(0, playbackTime - playback.clip.startTime)
      );
      transformRef.current = transform;
      setClipTransform(transform);

      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(bounds.displayWidth));
      const height = Math.max(1, Math.round(bounds.displayHeight));
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        renderer.resize(canvas.width, canvas.height);
      }

      renderer.draw(video, buildColorUniforms(transform, cropToUniform(playback.cropRect)));
      return;
    }

    if (playback.mode === "transition") {
      const transform = CLIP_ANIMATION_DEFAULTS;
      transformRef.current = transform;
      setClipTransform(transform);

      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(bounds.displayWidth));
      const height = Math.max(1, Math.round(bounds.displayHeight));
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        renderer.resize(canvas.width, canvas.height);
      }

      const transitionVideo = transitionVideoRef.current;
      if (transitionVideo) {
        renderer.drawTransition(video, transitionVideo, {
          kind: playback.kind,
          progress: playback.progress,
          cropRectA: playback.cropRectA,
          cropRectB: playback.cropRectB,
          sourceTimeA: playback.sourceTimeA,
          sourceTimeB: playback.sourceTimeB,
          opacityA: 1,
          opacityB: 1,
        });
      }
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.displayWidth));
    const height = Math.max(1, Math.round(bounds.displayHeight));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      renderer.resize(canvas.width, canvas.height);
    }
    renderer.draw(video, buildColorUniforms(CLIP_ANIMATION_DEFAULTS, cropToUniform({ originX: 0, originY: 0, sizeX: 1, sizeY: 1 })));
  }, [
    bounds.displayHeight,
    bounds.displayWidth,
    buildColorUniforms,
    cropToUniform,
    currentVideoUrl,
    naturalSize.height,
    naturalSize.width,
    setClipTransform,
  ]);

  useEffect(() => {
    measureBounds();
    const observer = new ResizeObserver(() => measureBounds());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measureBounds]);

  useEffect(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return;

    try {
      rendererRef.current = new ViewportRenderer(canvas);
    } catch {
      rendererRef.current = null;
    }

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [currentVideoUrl]);

  useEffect(() => {
    if (!currentVideoUrl) return;

    const tick = () => {
      renderFrame();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [currentVideoUrl, renderFrame]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    const tracks = useTimelineStore.getState().tracks;
    const playback = resolvePlaybackContext(tracks, currentVideoUrl, currentTime, {
      autoReframeEnabled,
      trackingPath,
      sourceWidth: naturalSize.width,
      sourceHeight: naturalSize.height,
    });

    if (playback.mode === "clip") {
      if (Math.abs(video.currentTime - playback.sourceTime) > 0.05) {
        video.currentTime = playback.sourceTime;
      }
    }

    video.muted = true;

    if (isPlaying) {
      void video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [
    autoReframeEnabled,
    currentTime,
    currentVideoUrl,
    isPlaying,
    naturalSize.height,
    naturalSize.width,
    setIsPlaying,
    trackingPath,
  ]);

  useEffect(() => {
    if (!isPlaying) return;

    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      if (!video || !currentVideoUrl) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const tracks = useTimelineStore.getState().tracks;
      const playback = resolvePlaybackContext(tracks, currentVideoUrl, useEditorStore.getState().currentTime, {
        autoReframeEnabled: useEditorStore.getState().autoReframeEnabled,
        trackingPath: useEditorStore.getState().trackingPath,
        sourceWidth: naturalSize.width,
        sourceHeight: naturalSize.height,
      });

      if (playback.mode === "clip") {
        const sourceTime = video.currentTime;
        if (sourceTime >= playback.clip.outPoint - 0.02) {
          video.currentTime = playback.clip.inPoint;
          setCurrentTime(playback.clip.startTime);
        } else if (sourceTime < playback.clip.inPoint) {
          video.currentTime = playback.clip.inPoint;
        } else {
          setCurrentTime(playback.clip.startTime + (sourceTime - playback.clip.inPoint));
        }
      } else if (playback.mode === "transition") {
        const transitionDuration =
          useTimelineStore
            .getState()
            .tracks.flatMap((track) => track.transitions)
            .find(
              (entry) =>
                entry.leftClipId === playback.leftClip.id && entry.rightClipId === playback.rightClip.id
            )?.duration ?? 0.6;
        setCurrentTime(
          playback.leftClip.startTime + playback.leftClip.duration + playback.progress * transitionDuration
        );
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoReframeEnabled, currentVideoUrl, isPlaying, naturalSize.height, naturalSize.width, setCurrentTime, trackingPath]);

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
      if (useEditorStore.getState().autoReframeEnabled) {
        void buildTrackingPathFromVideo(video, mediaDuration).then(setTrackingPath);
      } else if (useEditorStore.getState().trackingPath.length === 0) {
        setTrackingPath(buildMockTrackingPath(mediaDuration));
      }
      measureBounds();
    };

    const handleCanPlay = () => {
      if (useEditorStore.getState().isPlaying) {
        void video.play().catch(() => setIsPlaying(false));
      }
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [
    currentVideoUrl,
    measureBounds,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setSourceDimensions,
    setTrackingPath,
  ]);

  useEffect(() => {
    const canvas = reframeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx || !currentVideoUrl) return;

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

    const width = Math.max(1, Math.round(bounds.displayWidth));
    const height = Math.max(1, Math.round(bounds.displayHeight));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const displayX = boxX * bounds.scale;
    const displayY = boxY * bounds.scale;
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
    ctx.restore();
  }, [bounds, boxStyle, currentVideoUrl, naturalSize.height, naturalSize.width, reframePosition, setReframeBox, tool]);

  const clientToMaskPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = glCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      return { x, y };
    },
    []
  );

  const handleMaskPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!maskPenActive) return;
      event.stopPropagation();
      const point = clientToMaskPoint(event.clientX, event.clientY);
      if (!point) return;
      addMaskPoint(point);
    },
    [addMaskPoint, clientToMaskPoint, maskPenActive]
  );

  const startDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool !== "reframe" || !currentVideoUrl) return;

    const { boxWidth, boxHeight } = boxStyle;
    const sourceCenterX = naturalSize.width * reframePosition.x;
    const sourceCenterY = naturalSize.height * reframePosition.y;
    const boxX = clamp(sourceCenterX - boxWidth / 2, 0, Math.max(0, naturalSize.width - boxWidth));
    const boxY = clamp(sourceCenterY - boxHeight / 2, 0, Math.max(0, naturalSize.height - boxHeight));

    const displayX = boxX * bounds.scale;
    const displayY = boxY * bounds.scale;
    const displayBoxWidth = boxWidth * bounds.scale;
    const displayBoxHeight = boxHeight * bounds.scale;

    const withinHandle =
      event.clientX - (reframeCanvasRef.current?.getBoundingClientRect().left || 0) >= displayX + displayBoxWidth - 24 &&
      event.clientY - (reframeCanvasRef.current?.getBoundingClientRect().top || 0) >= displayY + displayBoxHeight - 24;

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
        setReframePosition({
          x: clamp(nextCenterX / naturalSize.width, 0, 1),
          y: clamp(nextCenterY / naturalSize.height, 0, 1),
        });
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
  const stageStyle = {
    left: bounds.offsetX,
    top: bounds.offsetY,
    width: bounds.displayWidth,
    height: bounds.displayHeight,
  };

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
                className="absolute h-full w-full object-contain"
                playsInline
                muted
                autoPlay
              />
              <video
                ref={transitionVideoRef}
                src={currentVideoUrl}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                playsInline
                muted
                preload="auto"
              />
              <canvas
                ref={glCanvasRef}
                className="absolute z-10"
                style={stageStyle}
              />
              <div className="absolute z-20" style={stageStyle}>
                <MaskPenOverlay
                  points={maskPoints}
                  closed={maskClosed}
                  active={maskPenActive}
                  width={bounds.displayWidth}
                  height={bounds.displayHeight}
                  onPointerDown={handleMaskPointerDown}
                />
              </div>
              {tool === "reframe" && (
                <canvas
                  ref={reframeCanvasRef}
                  className="absolute z-30"
                  style={stageStyle}
                  onPointerDown={startDrag}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_40%),linear-gradient(145deg,rgba(24,24,27,1),rgba(9,9,11,1))] text-zinc-400">
              <div className="rounded-full border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <Video className="h-8 w-8" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
