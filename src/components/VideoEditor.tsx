"use client";
import { useState } from "react";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import FileUpload from "./FileUpload";
import VideoPreview from "./VideoPreview";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import AudioSpeedControl from "./AudioSpeedControl";
import FormatSelector from "./FormatSelector";
import ExportSettings from "./ExportSettings";
import ExportOverlay from "./ExportOverlay";
import DownloadResult from "./DownloadResult";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import {
  Layers, Crop, Scissors, RotateCw, Volume2,
  SlidersHorizontal, Zap, AlertTriangle, Github
} from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ icon, title, children, delay = 0 }: SectionProps) {
  return (
    <div
      className="space-y-3 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-film-500 opacity-80">{icon}</span>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {children}
    </div>
  );
}

export default function VideoEditor() {
  const {
    file, duration, recipe, status, progress,
    result, error, updateRecipe,
    handleFileSelect, handleExport, cancelExport, reset, resetSettings,
  } = useVideoEditor();
  
  const [activeModule, setActiveModule] = useState<"resize" | "trim" | "color" | "rotate" | "export" | null>(null);
  const [copied, setCopied] = useState(false);
  
  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-[var(--bg)] text-[var(--text)] select-none">
      <ExportOverlay status={status} progress={progress} onCancel={cancelExport} />

      {/* Landing.LOVE Level Header */}
      <header className="sticky top-0 left-0 w-full px-12 py-6 flex items-center justify-between z-40 bg-[var(--bg)]/60 backdrop-blur-2xl border-b border-[var(--border)]/50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-10 bg-blue-600 rounded-full" />
            <h1 className="text-2xl font-black tracking-[0.25em] uppercase">
              REFRAME
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">Studio Engine</span>
            </div>
            <div className="w-px h-3 bg-[var(--border)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text)]">
              {file ? file.name : "Waiting for assets..."}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-px h-6 bg-[var(--border)] mx-2" />
          
          <button
            onClick={handleExport}
            disabled={!file || isProcessing}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.25em] transition-all duration-500",
              !file || isProcessing
                ? "bg-[var(--surface)] text-[var(--muted)] opacity-50 cursor-not-allowed border border-[var(--border)]"
                : "bg-[var(--text)] text-[var(--bg)] hover:scale-105 active:scale-95 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:shadow-blue-500/20"
            )}
          >
            {isProcessing ? (
              <Zap size={14} className="animate-spin text-blue-500" />
            ) : (
              <Zap size={14} fill="currentColor" />
            )}
            {isProcessing ? "Processing" : "Process Export"}
          </button>
        </div>
      </header>

      {/* Expansive Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 lg:p-32 relative mb-40">
        {!file ? (
          <div className="max-w-3xl w-full animate-in fade-in zoom-in-95 duration-1000">
            <FileUpload onFileSelect={handleFileSelect} currentFile={file} />
            <div className="mt-16 flex items-center justify-center gap-12 opacity-10">
              {["4K Support", "Zero Server Upload", "Instant Live Edit", "Browser Native"].map((tag) => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-[0.3em]">{tag}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full max-w-7xl flex items-center justify-center animate-in fade-in zoom-in-110 duration-1000 cubic-bezier(0.16, 1, 0.3, 1)">
            <VideoPreview file={file} recipe={recipe} />
          </div>
        )}

        {/* Professional Overlay System */}
        {(status === "error" || (status === "done" && result)) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-500" 
              onClick={reset}
              onKeyDown={(e) => e.key === "Escape" && reset()}
              role="button"
              tabIndex={-1}
              aria-label="Close modal"
            />
            <div className="relative w-full max-w-xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 cubic-bezier(0.16, 1, 0.3, 1)">
              {status === "error" && error && (
                <div className="bg-[var(--surface)] border border-red-500/20 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center gap-6">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-red-500 mb-3">Engine Error Detected</h2>
                    <p className="text-sm opacity-60 leading-relaxed max-w-sm mx-auto">{error}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(error);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-8 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black rounded-full transition-all tracking-widest border border-red-500/10"
                  >
                    {copied ? "COPIED TO CLIPBOARD" : "COPY DIAGNOSTIC LOG"}
                  </button>
                </div>
              )}
              {status === "done" && result && (
                <div className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
                  <DownloadResult result={result} onReset={reset} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Premium Bottom Dock (Taskbar) */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[calc(100%-6rem)] max-w-5xl z-50">
        
        {/* Contextual Module Tray */}
        <div className={cn(
          "mb-8 bg-[var(--surface)]/70 backdrop-blur-3xl border border-[var(--border)]/50 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)",
          activeModule ? "max-h-[400px] opacity-100 p-12" : "max-h-0 opacity-0 p-0"
        )}>
          {activeModule === "resize" && (
            <div className="flex flex-col md:flex-row gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-8">Aspect Preset</p>
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </div>
              <div className="w-px bg-[var(--border)] hidden md:block" />
              <div className="w-full md:w-80">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-8">Framing Logic</p>
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}

          {activeModule === "trim" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-10 text-center">Temporal Trimming</p>
              <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} />
            </div>
          )}

          {activeModule === "color" && (
            <div className="flex flex-col md:flex-row gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 space-y-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Post-Processing</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                  {[
                    { label: "Exposure", key: "brightness", min: -1, max: 1, step: 0.1, default: 0 },
                    { label: "Contrast", key: "contrast", min: 0, max: 2, step: 0.1, default: 1 },
                    { label: "Saturation", key: "saturation", min: 0, max: 3, step: 0.1, default: 1 },
                  ].map((adj) => (
                    <div key={adj.key} className="space-y-4">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="opacity-50">{adj.label}</span>
                        <button onClick={() => updateRecipe({ [adj.key]: adj.default })} className="text-blue-600 hover:text-blue-500 transition-colors">RESET</button>
                      </div>
                      <input
                        type="range" min={adj.min} max={adj.max} step={adj.step}
                        value={(recipe as any)[adj.key]}
                        onChange={(e) => updateRecipe({ [adj.key]: Number(e.target.value) })}
                        className="w-full accent-blue-600 h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer hover:accent-blue-500 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-[var(--border)] hidden md:block" />
              <div className="w-full md:w-80">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-10">Audio Mastering</p>
                <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}

          {activeModule === "rotate" && (
            <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-10 text-center">Engine Transformation</p>
              <RotateControl recipe={recipe} onChange={updateRecipe} />
            </div>
          )}

          {activeModule === "export" && (
            <div className="flex flex-col md:flex-row gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-8">Video Codec</p>
                <FormatSelector recipe={recipe} onChange={updateRecipe} />
              </div>
              <div className="w-px bg-[var(--border)] hidden md:block" />
              <div className="w-full md:w-80">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] mb-8">Bitrate Quality (CRF)</p>
                <ExportSettings recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}
        </div>

        {/* Global Control Dock */}
        <div className={cn(
          "bg-[var(--surface)]/80 backdrop-blur-3xl border border-[var(--border)]/50 rounded-[4rem] p-3 flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)",
          !file && "opacity-20 pointer-events-none grayscale translate-y-8"
        )}>
          <div className="flex-1 flex items-center justify-center gap-2 p-1">
            {[
              { id: "resize", icon: <Layers size={20} />, label: "Frame" },
              { id: "trim", icon: <Scissors size={20} />, label: "Trim" },
              { id: "color", icon: <SlidersHorizontal size={20} />, label: "Filters" },
              { id: "rotate", icon: <RotateCw size={20} />, label: "Spin" },
              { id: "export", icon: <Crop size={20} />, label: "Export" },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveModule(activeModule === tool.id ? null : tool.id as any)}
                className={cn(
                  "flex items-center gap-4 px-10 py-4.5 rounded-[3rem] transition-all duration-500 relative group overflow-hidden",
                  activeModule === tool.id 
                    ? "bg-[var(--text)] text-[var(--bg)] shadow-2xl scale-105" 
                    : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                )}
              >
                <div className={cn("transition-transform duration-500", activeModule === tool.id && "scale-110")}>
                  {tool.icon}
                </div>
                <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em]">{tool.label}</span>
                {activeModule === tool.id && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 animate-in slide-in-from-bottom-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pr-4">
            <div className="w-px h-8 bg-[var(--border)]" />
            <button
              onClick={resetSettings}
              className="p-5 text-[var(--muted)] hover:text-red-500 transition-all duration-500 hover:rotate-180"
              title="Reset Engine"
            >
              <RotateCw size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative Grid Backdrop */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(var(--text) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
