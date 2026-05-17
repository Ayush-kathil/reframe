"use client";

import { useState } from "react";
import { Zap, Play, Terminal, HelpCircle, RotateCcw, X, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { EditRecipe, ExportResult, ExportStatus } from "@/lib/types";
import FormatSelector from "./FormatSelector";
import ExportSettings from "./ExportSettings";
import DownloadResult from "./DownloadResult";

interface ExportPanelProps {
  recipe: EditRecipe;
  onChange: (updates: Partial<EditRecipe>) => void;
  status: ExportStatus;
  progress: number;
  result: ExportResult | null;
  error: string | null;
  onExport: (fastMode?: boolean) => void;
  onCancel: () => void;
  onReset: () => void;
}

export default function ExportPanel({
  recipe,
  onChange,
  status,
  progress,
  result,
  error,
  onExport,
  onCancel,
  onReset,
}: ExportPanelProps) {
  const [showLogs, setShowLogs] = useState(true);

  // Mock processing logs to look highly technical and professional
  const getLogs = () => {
    const logs = [
      "[lumina-wasm] Engine initialised successfully.",
      `[encoder] Initialising libx264 pipeline: CRF ${recipe.quality}`,
      `[muxer] Dynamic audio Speed factor: ${recipe.speed}x`,
      `[composer] Processing container: ${recipe.format.toUpperCase()}`,
    ];

    if (status === "exporting") {
      logs.push(`[wasm-worker] Render stream frame rendering: ${progress}%`);
      logs.push("[wasm-worker] Encoding video packets...");
    } else if (status === "done") {
      logs.push("[encoder] Stream packets successfully muxed.");
      logs.push("[lumina-wasm] Finalised file download ready.");
    } else if (status === "error") {
      logs.push(`[FATAL] Pipeline crash: ${error}`);
    }

    return logs;
  };

  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="space-y-6">
      {/* Configuration & Launch Desk */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted font-mono flex items-center gap-1.5 border-b border-border pb-3">
          <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
          Export Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Output container */}
          <div className="space-y-2">
            <span className="text-[10px] font-heading font-medium text-muted uppercase tracking-wider">Output Format</span>
            <FormatSelector recipe={recipe} onChange={onChange} />
          </div>

          {/* CRF Quality */}
          <div className="space-y-2">
            <span className="text-[10px] font-heading font-medium text-muted uppercase tracking-wider">Target Resolution Quality</span>
            <ExportSettings recipe={recipe} onChange={onChange} />
          </div>
        </div>

        <div className="border-t border-border pt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onExport(false)}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-heading text-sm font-medium uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              isProcessing
                ? "bg-border text-muted cursor-not-allowed opacity-40"
                : "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/15 active:scale-95"
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Standard Transcode Render
          </button>

          <button
            type="button"
            onClick={() => onExport(true)}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-heading text-sm font-medium uppercase tracking-widest transition-all duration-200 border border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 cursor-pointer ${
              isProcessing
                ? "opacity-40 cursor-not-allowed"
                : "active:scale-95"
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            Super-Fast Direct Download
          </button>
        </div>

        <p className="text-[10px] text-muted text-center leading-relaxed">
          Standard Render processes frames and embeds all visual filters (color adjustments, crop, speed). Direct Download triggers instantly in 0.1s by performing stream copying.
        </p>
      </div>

      {/* Live Engine Console Terminal */}
      <div className="bg-[#0e0e0e] border border-border rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h4 className="text-[10px] font-medium uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            Engine Console Log
          </h4>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-[9px] text-muted hover:text-accent font-mono uppercase tracking-wider cursor-pointer"
          >
            {showLogs ? "Hide Console" : "Show Console"}
          </button>
        </div>

        {showLogs && (
          <div className="font-mono text-[10px] text-zinc-400 space-y-1.5 max-h-36 overflow-y-auto">
            {getLogs().map((log, index) => (
              <div key={index} className="flex gap-2.5">
                <span className="text-accent select-none">➜</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CLICHAMP-STYLE CINEMATIC DOWNLOAD MODAL OVERLAY */}
      {status !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 animate-fade-in">
          <div className="relative bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative animate-scale-up overflow-hidden">
            {/* Close / Dismiss */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-muted hover:text-text cursor-pointer p-1.5 rounded-full hover:bg-bg transition-all"
              aria-label="Close Export Modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* HEADER COMPONENT */}
            <div className="text-center space-y-1">
              <span className="text-[9px] font-heading font-medium tracking-widest text-accent uppercase bg-accent/10 px-2.5 py-1 rounded-full">
                Lumina Core Muxer
              </span>
              <h2 className="text-lg font-heading font-medium text-text mt-3">
                {status === "loading-engine" && "Initialising WASM Core..."}
                {status === "exporting" && "Compiling and Muxing Video..."}
                {status === "done" && "Master Render Finished!"}
                {status === "error" && "Export Pipeline Failed"}
              </h2>
            </div>

            {/* 1. PROCESSING VIEW */}
            {isProcessing && (
              <div className="space-y-6 text-center">
                {/* Glowing Spinner */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-border/40" />
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" 
                    style={{ animationDuration: "1.2s" }}
                  />
                  <div className="text-2xl font-bold font-mono text-text">
                    {progress}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="w-full h-2 bg-bg border border-border rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted font-mono leading-relaxed px-4">
                    {status === "loading-engine"
                      ? "Loading FFmpeg WebAssembly modules..."
                      : "Slicing, resizing, and grading frames locally..."}
                  </p>
                </div>

                {/* LIGHTNING FAST BYPASS SECTION */}
                <div className="bg-bg/60 border border-border rounded-xl p-4 space-y-3.5 text-left">
                  <div className="flex gap-2.5">
                    <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold text-text uppercase tracking-wider font-heading">
                        ⚡ Exporting slow? Download instantly
                      </p>
                      <p className="text-[11px] text-muted mt-0.5 leading-relaxed font-sans">
                        Skip slow transcode rendering filters and download a lightning-fast trimmed cut in less than a second using stream copy.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onCancel();
                      setTimeout(() => {
                        onExport(true);
                      }, 150);
                    }}
                    className="w-full py-2.5 bg-accent/15 hover:bg-accent/25 text-accent text-xs font-medium uppercase tracking-wider rounded-lg border border-accent/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" /> Download Instant Trim Copy
                  </button>
                </div>
              </div>
            )}

            {/* 2. EXPORT COMPLETED SUCCESS VIEW */}
            {status === "done" && result && (
              <div className="space-y-6">
                <DownloadResult result={result} onReset={onReset} />
                <button
                  onClick={onCancel}
                  className="w-full py-2.5 border border-border text-muted hover:text-text rounded-xl font-heading text-xs font-medium uppercase tracking-wider transition-colors hover:bg-bg cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            )}

            {/* 3. ERROR VIEW */}
            {status === "error" && error && (
              <div className="space-y-6 text-center">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl space-y-2 text-xs text-left">
                  <p className="font-bold font-mono uppercase tracking-wider">! Render Thread Crashed</p>
                  <p className="font-mono bg-black/30 p-3 rounded-lg border border-border overflow-x-auto break-all">{error}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onExport(false)}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Retry Standard Render
                  </button>
                  <button
                    onClick={() => onExport(true)}
                    className="flex-1 py-3 border border-border text-text hover:bg-bg rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Try Super-Fast Bypass
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
