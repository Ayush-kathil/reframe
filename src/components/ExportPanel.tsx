"use client";

import { useState } from "react";
import { Zap, Play, Terminal, HelpCircle, RefreshCw, FileText } from "lucide-react";
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
  file: File | null;
  onExport: () => void;
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
  file,
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
      `[muxer] Dynamic audio speed factor: ${recipe.speed}x`,
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
    <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 animate-fade-in relative">
      {/* Col 1: Config Settings */}
      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted font-mono flex items-center gap-1.5 border-b border-border pb-3">
            <Zap className="w-3.5 h-3.5" />
            Config settings
          </h3>

          <div className="space-y-5">
            {/* Output container */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Output format</span>
              <FormatSelector recipe={recipe} onChange={onChange} />
            </div>

            {/* CRF Quality */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">Export quality</span>
              <ExportSettings recipe={recipe} onChange={onChange} />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {status === "done" && result ? (
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-center text-xs text-secondary font-mono">
                ✓ Render Completed Successfully
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onExport}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-heading text-base font-medium uppercase tracking-wider transition-all duration-200 ${
                    isProcessing
                      ? "bg-border text-muted cursor-not-allowed opacity-40 animate-pulse"
                      : "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/15 active:scale-95 cursor-pointer"
                  }`}
                >
                  {isProcessing ? "PROCESSING RENDER" : "LAUNCH EXPORT"}
                </button>

                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = URL.createObjectURL(file);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Draft_${file.name}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary hover:text-secondary-hover rounded-xl font-heading text-xs font-medium uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    Instant Download (Super Fast Draft)
                  </button>
                )}
              </div>
            )}

            {isProcessing && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-center text-xs text-red-500 hover:underline font-mono mt-3 uppercase tracking-wider"
              >
                Cancel Compile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Col 2: Progress & Output Hub */}
      <div className="space-y-6">
        {/* If completed, display output statistics cards */}
        {status === "done" && result ? (
          <div className="animate-fade-in">
            <DownloadResult result={result} onReset={onReset} />
          </div>
        ) : (
          /* Render Progress Board */
          <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted font-mono flex items-center gap-1.5 border-b border-border pb-3">
              <Play className="w-3.5 h-3.5" />
              Compile progress
            </h3>

            {status === "idle" && (
              <div className="py-12 text-center text-xs text-muted font-sans max-w-sm mx-auto space-y-3">
                <HelpCircle className="w-8 h-8 mx-auto opacity-30" />
                <p className="font-semibold text-sm text-text">Pipeline Idle</p>
                <p>Configure your preset preferences in the sidebar and launch the export thread to build the final master video file.</p>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4 py-4 max-w-md mx-auto text-center">
                <div className="text-2xl font-bold font-mono text-accent animate-pulse">{progress}%</div>
                <div className="w-full h-2 bg-bg border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  {status === "loading-engine"
                    ? "Initialising WASM environment loaders..."
                    : "Assembling frames and audio mux channels..."}
                </p>
              </div>
            )}

            {status === "error" && error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl space-y-3 text-xs">
                <p className="font-bold font-mono uppercase tracking-wider">! Render Pipeline Error</p>
                <p className="font-mono bg-black/30 p-3 rounded-lg border border-border">{error}</p>
                <button
                  onClick={onExport}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
                >
                  Retry Render Thread
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Engine Console Terminal */}
        <div className="bg-[#0e0e0e] border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h4 className="text-[10px] font-medium uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              Engine Console Log
            </h4>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-[9px] text-muted hover:text-accent font-mono uppercase tracking-wider"
            >
              {showLogs ? "Hide Console" : "Show Console"}
            </button>
          </div>

          {showLogs && (
            <div className="font-mono text-[10px] text-zinc-400 space-y-1.5 max-h-44 overflow-y-auto">
              {getLogs().map((log, index) => (
                <div key={index} className="flex gap-2.5">
                  <span className="text-accent select-none">➜</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Clipchamp-style Centered Export Modal Overlay ── */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border/80 w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden text-left">
            {/* Ambient Background Radial Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-2 relative z-10">
              <h3 className="font-heading font-medium text-lg text-text">Exporting video composition</h3>
              <p className="text-xs text-muted font-sans max-w-xs mx-auto">
                Lumina Cut is encoding and packaging your video inside your browser using hardware acceleration.
              </p>
            </div>

            {/* Premium Circular Progress Tracker */}
            <div className="relative z-10 flex flex-col items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-bg fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-accent fill-none transition-all duration-300 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - progress / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-text">{progress}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted font-mono mt-0.5">
                    {status === "loading-engine" ? "Booting" : "Encoding"}
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated time or current stream stage */}
            <div className="relative z-10 text-[10px] font-mono text-muted bg-bg/50 border border-border/40 py-2.5 px-4 rounded-xl">
              {status === "loading-engine"
                ? "➜ Initializing browser WASM sandbox..."
                : "➜ Muxing streams into container..."}
            </div>

            <div className="relative z-10 flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 border border-border hover:bg-bg text-muted hover:text-text rounded-xl font-heading text-xs font-medium uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancel Export
              </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
