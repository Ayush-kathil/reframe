"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Sparkles, Upload } from "lucide-react";
import EditorToolPanels, { editorTools, type EditorToolKey } from "./EditorToolPanels";
import LiveViewport from "./LiveViewport";
import MobileToolSheet from "./mobile/MobileToolSheet";
import MobileToolbar from "./mobile/MobileToolbar";
import UploadOnboarding from "./UploadOnboarding";
import CompactTimeline from "./timeline/CompactTimeline";
import MultiTrackTimeline from "./timeline/MultiTrackTimeline";
import { pickVideoFile } from "@/lib/videoUpload";
import { exportFromSnapshot } from "@/lib/ffmpeg";
import { useEditorStore } from "@/store/editorStore";

const HEADER_HEIGHT = "4rem";

function mapViewportTool(tool: EditorToolKey): "media" | "text" | "reframe" | "adjustments" {
  if (tool === "reframe") return "reframe";
  if (tool === "adjustments") return "adjustments";
  if (tool === "text") return "text";
  return "media";
}

export default function PremiumEditorShell() {
  const [activeTool, setActiveTool] = useState<EditorToolKey>("adjustments");
  const [mobileTool, setMobileTool] = useState<EditorToolKey | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isVideoUploaded,
    currentTime,
    isPlaying,
    duration,
    originalFile,
    ingestVideoFile,
    togglePlayback,
    resetEditor,
  } = useEditorStore();

  const exportDisabled = useMemo(() => !originalFile || isExporting, [isExporting, originalFile]);

  const handleExport = async () => {
    const state = useEditorStore.getState();
    if (!state.originalFile) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      await exportFromSnapshot(
        {
          originalFile: state.originalFile,
          sourceDimensions: state.sourceDimensions,
          reframeBox: state.reframeBox,
          brightness: state.brightness,
          contrast: state.contrast,
        },
        (percent) => setExportProgress(percent)
      );
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleImport = (files: FileList | null) => {
    const file = pickVideoFile(files);
    if (file) {
      ingestVideoFile(file);
      setActiveTool("adjustments");
      setMobileTool(null);
    }
  };

  const handleMobileToolSelect = (tool: EditorToolKey) => {
    setMobileTool((current) => (current === tool ? null : tool));
  };

  if (!isVideoUploaded) {
    return (
      <AnimatePresence mode="wait">
        <UploadOnboarding key="onboarding" />
      </AnimatePresence>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full flex-col">
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-none absolute left-1/2 top-4 z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-white/10 bg-surface/80 p-2 shadow-2xl shadow-black/60 backdrop-blur-2xl"
            >
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  transition={{ ease: "easeOut", duration: 0.18 }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                <span>Exporting</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header
          className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-background/60 px-4 backdrop-blur-2xl sm:px-5"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
              <Sparkles className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-50">Reframe Studio</p>
              <p className="text-xs text-zinc-400">Premium editor</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition hover:bg-white/10 sm:px-4"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 sm:px-4"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden p-3 md:p-4 lg:p-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="hidden min-h-0 flex-1 grid-cols-[88px_minmax(0,1fr)_320px] gap-4 overflow-hidden md:grid"
          >
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-surface/60 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="flex flex-col items-center gap-2">
                {editorTools.map((tool) => {
                  const Icon = tool.icon;
                  const selected = activeTool === tool.key;

                  return (
                    <motion.button
                      key={tool.key}
                      type="button"
                      layout
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTool(tool.key)}
                      className={`flex w-full flex-col items-center gap-1 rounded-2xl px-3 py-3 text-xs transition ${selected ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Icon className="h-5 w-5" />
                      {tool.label}
                    </motion.button>
                  );
                })}
              </div>
            </aside>

            <main className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-surface/60 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:p-5">
                <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col">
                  <LiveViewport tool={mapViewportTool(activeTool)} />
                </div>
              </section>

              <section className="shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-surface/60 p-4 shadow-xl shadow-black/40 backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
                  <span>Timeline</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-200 hover:bg-white/10"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="font-mono text-zinc-200">
                      {currentTime.toFixed(1)}s / {duration > 0 ? `${duration.toFixed(1)}s` : "--"}
                    </span>
                  </div>
                </div>
                <MultiTrackTimeline />
              </section>
            </main>

            <aside className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-surface/60 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-50">
                    {editorTools.find((tool) => tool.key === activeTool)?.label}
                  </p>
                  <p className="text-xs text-zinc-400">Properties</p>
                </div>
                <button
                  type="button"
                  onClick={resetEditor}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="editor-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTool}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.16 }}
                  >
                    <EditorToolPanels activeTool={activeTool} onImport={() => fileInputRef.current?.click()} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </aside>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden"
          >
            <section className="h-[42vh] min-h-[220px] max-h-[420px] shrink-0 overflow-hidden rounded-[24px] border border-white/5 bg-zinc-900/80 p-2 shadow-xl shadow-black/30">
              <LiveViewport tool={mapViewportTool(mobileTool || activeTool)} />
            </section>

            <MobileToolbar activeTool={mobileTool} onSelect={handleMobileToolSelect} />

            <section className="min-h-0 flex-1 overflow-hidden px-1 pb-2 pt-2">
              <CompactTimeline className="h-full" />
            </section>
          </motion.div>
        </div>

        <MobileToolSheet open={Boolean(mobileTool)} activeTool={mobileTool} onClose={() => setMobileTool(null)} />

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          className="hidden"
          onChange={(event) => {
            handleImport(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
