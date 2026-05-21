"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PRESETS } from "@/lib/presets";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import type { EditRecipe } from "@/lib/types";
import ExportOverlay from "./ExportOverlay";
import VideoPreview from "./VideoPreview";
import FileUpload from "./FileUpload";
import PresetSelector from "./PresetSelector";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import AudioMixer from "./AudioMixer";
import FramingControl from "./FramingControl";
import ExportSettings from "./ExportSettings";
import EffectsPanel from "./EffectsPanel";
import ColorGradingPanel from "./ColorGradingPanel";
import TransitionsPanel from "./TransitionsPanel";
import BrandKitPanel from "./BrandKitPanel";
import CaptionsPanel from "./CaptionsPanel";
import DownloadResult from "./DownloadResult";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CloudUpload,
  Frame,
  HelpCircle,
  Image as ImageIcon,
  Layers3,
  LayoutGrid,
  Mic,
  Pause,
  Play,
  ScanFace,
  Scissors,
  Settings2,
  Sparkles,
  SquarePlay,
  Upload,
  WandSparkles,
  Search,
  ZoomIn,
  ZoomOut,
  LayoutDashboard,
} from "lucide-react";

type ToolKey = "properties" | "framing" | "effects" | "transitions" | "brand" | "captions" | "audio" | "export";

const railItems: Array<{ label: string; icon: React.ComponentType<{ className?: string }>; tool: ToolKey }> = [
  { label: "AI Tools", icon: Bot, tool: "properties" },
  { label: "Video", icon: SquarePlay, tool: "properties" },
  { label: "Audio", icon: Mic, tool: "audio" },
  { label: "Image", icon: ImageIcon, tool: "effects" },
  { label: "Subtitles", icon: Layers3, tool: "captions" },
  { label: "Text", icon: ScanFace, tool: "captions" },
  { label: "Elements", icon: LayoutGrid, tool: "brand" },
  { label: "Brand Kit", icon: Frame, tool: "brand" },
  { label: "Settings", icon: Settings2, tool: "export" },
];

const talkingCharacters = ["Ava", "Noah", "Mia", "Leo", "Zoe", "Iris", "Jude", "Nia"];
const stockVideos = ["0:18", "1:10", "0:10", "0:40", "0:21", "0:19"];

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-[var(--muted)]">{subtitle}</p>}
    </div>
  );
}

export default function StudioShell() {
  const { file, duration, recipe, status, progress, result, videoRef, seekTo, handleFileSelect, handleExport, cancelExport, updateRecipe, reset, undoRecipe, redoRecipe } = useVideoEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewDropRef = useRef<HTMLDivElement>(null);
  const [projectName] = useState("Project Name");
  const [activeMode, setActiveMode] = useState<"Create" | "Edit" | "Record">("Edit");
  const [activeTool, setActiveTool] = useState<ToolKey>("properties");
  const [isDragActive, setIsDragActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timelineZoom, setTimelineZoom] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);

  const onFilePicked = useCallback((picked: File) => {
    void handleFileSelect(picked);
  }, [handleFileSelect]);

  const openUploader = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const selectCreationMode = useCallback((mode: "Create" | "Edit" | "Record") => {
    setActiveMode(mode);
    if (mode === "Create") {
      setActiveTool("properties");
      openUploader();
      return;
    }

    if (mode === "Record") {
      setActiveTool("audio");
      return;
    }

    setActiveTool("properties");
  }, [openUploader]);

  const quickEnhance = useCallback(() => {
    updateRecipe({ brightness: 0.06, contrast: 0.08, saturation: 0.1 });
    setActiveTool("effects");
  }, [updateRecipe]);

  const applyTalkingCharacter = useCallback((name: string) => {
    updateRecipe({
      captionEnabled: true,
      captionText: name,
      captionStyle: "bold",
      captionPosition: "bottom",
    });
    setActiveTool("captions");
  }, [updateRecipe]);

  const applyStockClip = useCallback((index: number) => {
    const presets: Partial<EditRecipe>[] = [
      { framing: "fit", stabilization: true },
      { framing: "fill", brightness: 0.04, contrast: 0.06 },
      { saturation: 0.12, hueRotate: 8 },
      { sepia: 0.12, vignette: 0.18 },
    ];

    updateRecipe(presets[index % presets.length]!);
    setActiveTool("effects");
  }, [updateRecipe]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncTime = () => setCurrentTime(video.currentTime || 0);
    const syncPlayState = () => setIsPlaying(true);
    const syncPauseState = () => setIsPlaying(false);

    syncTime();
    setIsPlaying(!video.paused && !video.ended);

    video.addEventListener("timeupdate", syncTime);
    video.addEventListener("seeked", syncTime);
    video.addEventListener("loadedmetadata", syncTime);
    video.addEventListener("play", syncPlayState);
    video.addEventListener("pause", syncPauseState);

    return () => {
      video.removeEventListener("timeupdate", syncTime);
      video.removeEventListener("seeked", syncTime);
      video.removeEventListener("loadedmetadata", syncTime);
      video.removeEventListener("play", syncPlayState);
      video.removeEventListener("pause", syncPauseState);
    };
  }, [videoRef, file]);

  useEffect(() => {
    const handleWindowDragOver = (event: DragEvent) => {
      event.preventDefault();
      setIsDragActive(true);
    };

    const handleWindowDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDragActive(false);
      const picked = event.dataTransfer?.files?.[0];
      if (picked) {
        void handleFileSelect(picked);
      }
    };

    const handleWindowDragEnd = () => setIsDragActive(false);

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragleave", handleWindowDragEnd);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragleave", handleWindowDragEnd);
    };
  }, [handleFileSelect]);

  const canvasLabel = useMemo(
    () => PRESETS.find((preset) => preset.id === recipe.preset) ?? PRESETS[3],
    [recipe.preset]
  );

  const onDropFile = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const picked = event.dataTransfer.files?.[0];
    if (picked) onFilePicked(picked);
  }, [onFilePicked]);

  const onDragOverFile = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleTimelineSeek = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const nextTime = ratio * duration;
    seekTo(nextTime);
    setCurrentTime(nextTime);
  }, [duration, seekTo]);

  const handlePlayToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [videoRef]);

  const handleTimelineSplit = useCallback(() => {
    updateRecipe({ trimEnd: duration > 0 ? Math.min(duration, Math.max(recipe.trimStart, currentTime)) : currentTime });
    setActiveTool("properties");
  }, [currentTime, duration, recipe.trimStart, updateRecipe]);

  const toolPanel = useMemo(() => {
    switch (activeTool) {
      case "framing":
        return <FramingControl recipe={recipe} onChange={updateRecipe} />;
      case "effects":
        return <div className="space-y-4"><EffectsPanel recipe={recipe} onChange={updateRecipe} /><ColorGradingPanel recipe={recipe} onChange={updateRecipe} /></div>;
      case "transitions":
        return <TransitionsPanel recipe={recipe} onChange={updateRecipe} />;
      case "brand":
        return <BrandKitPanel recipe={recipe} onChange={updateRecipe} />;
      case "captions":
        return <CaptionsPanel recipe={recipe} onChange={updateRecipe} duration={duration} />;
      case "audio":
        return <AudioMixer recipe={recipe} onChange={updateRecipe} duration={duration} />;
      case "export":
        return <ExportSettings recipe={recipe} duration={duration} onChange={updateRecipe} />;
      case "properties":
      default:
        return (
          <div className="space-y-4">
            <PresetSelector recipe={recipe} onChange={updateRecipe} />
            <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} />
            <RotateControl recipe={recipe} onChange={updateRecipe} />
            <AudioMixer recipe={recipe} onChange={updateRecipe} duration={duration} />
          </div>
        );
    }
  }, [activeTool, duration, recipe, updateRecipe]);

  const toolTabs: Array<{ key: ToolKey; label: string }> = [
    { key: "properties", label: "Properties" },
    { key: "framing", label: "Framing" },
    { key: "effects", label: "Effects" },
    { key: "transitions", label: "Transitions" },
    { key: "brand", label: "Brand" },
    { key: "captions", label: "Captions" },
    { key: "audio", label: "Audio" },
    { key: "export", label: "Export" },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f6f4f1] text-[var(--text)]">
      <ExportOverlay status={status} progress={progress} onCancel={cancelExport} />

      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-4 pr-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <span className="text-xl font-black">V</span>
            </div>
            <button type="button" onClick={openUploader} className="flex items-center gap-2 text-left" title="Open a video">
              <span className="truncate text-sm font-medium">{projectName}</span>
              <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
            </button>
            <button type="button" onClick={undoRecipe} className="rounded-full p-2 text-[var(--muted)] hover:bg-black/5" title="Undo last edit"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={redoRecipe} className="rounded-full p-2 text-[var(--muted)] hover:bg-black/5" title="Redo last edit"><ChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-black/5 bg-white p-1 shadow-sm">
              {(["Create", "Edit", "Record"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => selectCreationMode(mode)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", activeMode === mode ? "bg-black/5 text-black" : "text-[var(--muted)] hover:text-black")}>{mode}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={quickEnhance} className="rounded-full p-2 text-[var(--muted)] hover:bg-black/5" title="Quick enhance"><Sparkles className="h-4 w-4" /></button>
            <button type="button" onClick={() => setActiveTool("properties")} className="rounded-full p-2 text-[var(--muted)] hover:bg-black/5" title="Open editing tools"><Search className="h-4 w-4" /></button>
            <button type="button" onClick={() => setActiveTool("captions")} className="rounded-full p-2 text-[var(--muted)] hover:bg-black/5" title="Open caption tools"><HelpCircle className="h-4 w-4" /></button>
            <button type="button" onClick={handleExport} className="ml-2 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"><Check className="h-4 w-4" />Done</button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-[72px] flex-col items-center gap-1 border-r border-black/5 bg-white py-4">
            {railItems.map((item) => {
              const Icon = item.icon;
              const selected = activeTool === item.tool;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTool(item.tool)}
                  className={cn("flex h-12 w-12 flex-col items-center justify-center rounded-2xl text-[11px] transition-colors", selected ? "bg-black/5 text-black" : "text-[var(--muted)] hover:bg-black/5 hover:text-black")}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </aside>

          <aside className="w-[380px] shrink-0 overflow-y-auto border-r border-black/5 bg-white px-5 py-4">
            <div className="space-y-5">
              <SectionHeader title="Video" subtitle="Drag and drop a video or choose from the panels below." />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setActiveMode("Create"); openUploader(); }} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"><WandSparkles className="h-4 w-4" />Generate</button>
                <button type="button" onClick={openUploader} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-black/[0.03]"><Upload className="h-4 w-4" />Upload</button>
                <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const picked = e.target.files?.[0]; if (picked) onFilePicked(picked); }} />
              </div>

              {!file ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-3">
                  <FileUpload onFileSelect={onFilePicked} currentFile={file} fileError={""} />
                </div>
              ) : (
                <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-3 text-sm text-[var(--muted)]">
                  <p className="font-medium text-black">{file.name}</p>
                  <p className="mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB · {duration.toFixed(1)}s</p>
                </div>
              )}

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Talking Characters</h3>
                  <button type="button" onClick={() => setActiveTool("captions")} className="text-sm text-[var(--muted)] hover:text-black">View all <ChevronRight className="inline h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {talkingCharacters.map((name) => (
                    <button key={name} type="button" onClick={() => applyTalkingCharacter(name)} className="group text-left">
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300 shadow-sm" />
                      <p className="mt-1.5 truncate text-[11px] font-medium text-[var(--muted)] group-hover:text-black">{name}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Stock Videos</h3>
                  <button type="button" onClick={() => setActiveTool("effects")} className="text-sm text-[var(--muted)] hover:text-black">View all <ChevronRight className="inline h-4 w-4" /></button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {['All', 'Aerials', 'Business', 'Nature'].map((chip, index) => (
                    <button key={chip} type="button" onClick={() => applyStockClip(index)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium border', index === 0 ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]' : 'bg-[var(--surface)]/70 border-transparent text-[var(--muted)]')}>{chip}</button>
                  ))}
                  <button type="button" onClick={() => setActiveTool("effects")} className="rounded-full px-4 py-1.5 text-sm font-medium border bg-[var(--surface)]/70 border-transparent text-[var(--muted)]">…</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {stockVideos.map((durationLabel, index) => (
                    <button key={`${durationLabel}-${index}`} type="button" onClick={() => applyStockClip(index)} className="relative aspect-video overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-500 shadow-sm">
                      <div className="absolute left-2 bottom-2 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white">{durationLabel}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f7f5]">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-8 py-5">
              <div
                ref={previewDropRef}
                onDragOver={onDragOverFile}
                onDrop={onDropFile}
                onDragLeave={() => setIsDragActive(false)}
                className={cn("relative w-full max-w-[1080px] self-center rounded-[2rem] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.06)] transition-colors", isDragActive ? "bg-indigo-50" : "bg-[#f7f4f1]")}
              >
                {isDragActive && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] border-2 border-dashed border-indigo-400 bg-white/70 backdrop-blur-sm">
                    <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-lg">
                      <CloudUpload className="mx-auto mb-2 h-8 w-8 text-indigo-600" />
                      <p className="text-base font-semibold text-black">Drop the video to import it</p>
                      <p className="text-sm text-[var(--muted)]">MP4, MOV, WebM, MKV, AVI</p>
                    </div>
                  </div>
                )}
                <div className="relative aspect-video overflow-hidden rounded-[1.35rem] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  {file ? (
                    <VideoPreview file={file} recipe={recipe} videoRef={videoRef} />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center text-white/80">
                      <div>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <CloudUpload className="h-7 w-7" />
                        </div>
                        <p className="text-lg font-medium text-white/90">Drop media here to begin</p>
                        <p className="mt-1 text-sm text-white/50">Drag a video file or use the Upload button.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="-mt-2 flex justify-center">
                <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm">
                  <button type="button" onClick={() => setActiveTool("properties")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/[0.03]"><SquarePlay className="h-4 w-4" />{canvasLabel?.label ?? "Custom"} ({canvasLabel?.width ?? recipe.customWidth}×{canvasLabel?.height ?? recipe.customHeight})<ChevronDown className="h-4 w-4 text-[var(--muted)]" /></button>
                  <span className="h-6 w-px bg-black/5" />
                  <button type="button" className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/[0.03]"><Circle className="mr-2 inline h-4 w-4 fill-black" />Background</button>
                  <button type="button" className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/[0.03]" onClick={() => setActiveTool("export")}><Settings2 className="mr-2 inline h-4 w-4" />Settings</button>
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 bg-white px-5 py-4 shadow-[0_-1px_0_rgba(0,0,0,0.03)]">
              <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={handleTimelineSplit} className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-black/5"><Scissors className="inline h-4 w-4" /> Split</button>
                <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                  <button type="button" className="rounded-full p-2 hover:bg-black/5" onClick={handlePlayToggle} title={isPlaying ? "Pause playback" : "Play playback"}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                  <span className="font-mono text-black">{currentTime.toFixed(1)}s / {duration > 0 ? `${duration.toFixed(1)}s` : "00.0s"}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <ZoomOut className="h-4 w-4" />
                  <input type="range" min={20} max={100} value={timelineZoom} onChange={(e) => setTimelineZoom(Number(e.target.value))} className="w-32 accent-indigo-500" aria-label="Timeline zoom" />
                  <ZoomIn className="h-4 w-4" />
                  <span className="text-sm">Fit</span>
                </div>
              </div>

              <div className="relative h-48 overflow-hidden rounded-2xl border border-black/5 bg-[#faf9f7]">
                <div className="absolute inset-x-0 top-0 h-8 border-b border-black/5 bg-white/70" />
                <div className="absolute left-0 right-0 top-8 border-t border-dashed border-black/10" />
                <div
                  className="absolute left-0 right-0 top-12 flex h-16 items-end overflow-hidden px-4 text-[10px] text-[var(--muted)]"
                  style={{ transform: `scaleX(${timelineZoom / 50})`, transformOrigin: "center top" }}
                >
                  {['0s', '10s', '20s', '30s', '40s', '50s', '1m'].map((mark) => <span key={mark} className="flex-1 text-center">{mark}</span>)}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-20 border-t border-black/5 bg-white/70 px-4 py-3">
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-black/10 bg-black/[0.02] text-sm text-[var(--muted)]">+ Add media to this project</div>
                </div>
                <button
                  type="button"
                  onClick={handleTimelineSeek}
                  className="absolute inset-x-0 top-8 bottom-20 cursor-pointer"
                  aria-label="Seek timeline"
                >
                  <div className="absolute inset-y-0 left-0 w-px bg-indigo-500/80" style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
                  <div className="absolute top-[-2px] h-0 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-indigo-500" style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 8px)` }} />
                  {recipe.trimEnd !== null && duration > 0 && (
                    <div
                      className="absolute top-3 bottom-3 rounded-full bg-indigo-100/70"
                      style={{
                        left: `${(recipe.trimStart / duration) * 100}%`,
                        width: `${Math.max(0, ((recipe.trimEnd - recipe.trimStart) / duration) * 100)}%`,
                      }}
                    />
                  )}
                </button>
              </div>
            </div>
          </main>

          <aside className="w-[390px] shrink-0 overflow-y-auto border-l border-black/5 bg-white px-5 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{activeTool}</h3>
                <button type="button" onClick={() => setActiveTool("properties")} className="text-sm text-[var(--muted)] hover:text-black">Reset</button>
              </div>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-black/5 bg-black/[0.02] p-2">
                {toolTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTool(tab.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      activeTool === tab.key ? "bg-black text-white" : "bg-white text-[var(--muted)] hover:text-black"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {toolPanel}
              {result && (
                <div className="pt-2">
                  <DownloadResult result={result} onReset={reset} soundOnCompletion={recipe.soundOnCompletion} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
