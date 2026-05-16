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

      {/* Senior Level Header */}
      <header className="sticky top-0 left-0 w-full px-8 py-4 flex items-center justify-between z-40 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h1 className="text-2xl tracking-[0.2em] font-black uppercase">
              REFRAME
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {file ? file.name : "Studio Engine Ready"}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="w-px h-6 bg-[var(--border)] mx-1" />
          
          <button
            onClick={handleExport}
            disabled={!file || isProcessing}
            className={cn(
              "flex items-center gap-3 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all",
              !file || isProcessing
                ? "bg-[var(--surface)] text-[var(--muted)] opacity-50 cursor-not-allowed"
                : "bg-[var(--text)] text-[var(--bg)] hover:scale-105 active:scale-95 shadow-xl hover:shadow-blue-500/20"
            )}
          >
            <Zap size={14} className={cn(isProcessing && "animate-spin")} />
            {isProcessing ? "Processing" : "Process Now"}
          </button>
        </div>
      </header>

      {/* Main Visual Workspace with more space */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 relative mb-32">
        {!file ? (
          <div className="max-w-2xl w-full animate-in fade-in zoom-in-95 duration-700">
            <FileUpload onFileSelect={handleFileSelect} currentFile={file} />
          </div>
        ) : (
          <div className="w-full h-full max-w-7xl flex items-center justify-center animate-in fade-in zoom-in-105 duration-1000 ease-out">
            <VideoPreview file={file} recipe={recipe} />
          </div>
        )}

        {/* Modal-style Download Result */}
        {(status === "error" || (status === "done" && result)) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
              onClick={reset}
              onKeyDown={(e) => e.key === "Escape" && reset()}
              role="button"
              tabIndex={-1}
              aria-label="Close modal"
            />
            <div className="relative w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
              {status === "error" && error && (
                <div className="bg-[var(--surface)] border border-red-500/30 p-6 rounded-3xl shadow-2xl flex items-start gap-4">
                  <AlertTriangle size={24} className="text-red-500 mt-1 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1 text-left">Engine Warning</p>
                    <p className="text-sm opacity-80 text-left leading-relaxed">{error}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(error);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded-full transition-colors"
                    >
                      {copied ? "COPIED TO CLIPBOARD" : "COPY ERROR LOG"}
                    </button>
                  </div>
                </div>
              )}
              {status === "done" && result && (
                <div className="shadow-2xl shadow-black/50">
                  <DownloadResult result={result} onReset={reset} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Horizontal Taskbar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-5xl z-50">
        
        {/* Contextual Settings Tray */}
        <div className={cn(
          "mb-6 bg-[var(--surface)]/80 backdrop-blur-3xl border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out",
          activeModule ? "max-h-72 opacity-100 p-8" : "max-h-0 opacity-0 p-0"
        )}>
          {activeModule === "resize" && (
            <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6">Output Dimensions</p>
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </div>
              <div className="w-px bg-[var(--border)] hidden md:block" />
              <div className="w-full md:w-64">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6">Canvas Framing</p>
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}

          {activeModule === "trim" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6 text-center">Precise Time Range</p>
              <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} />
            </div>
          )}

          {activeModule === "color" && (
            <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1 space-y-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Visual Tuner</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {[
                    { label: "Brightness", key: "brightness", min: -1, max: 1, step: 0.1, default: 0 },
                    { label: "Contrast", key: "contrast", min: 0, max: 2, step: 0.1, default: 1 },
                    { label: "Saturation", key: "saturation", min: 0, max: 3, step: 0.1, default: 1 },
                  ].map((adj) => (
                    <div key={adj.key} className="space-y-3">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="opacity-60">{adj.label}</span>
                        <button onClick={() => updateRecipe({ [adj.key]: adj.default })} className="text-blue-500 hover:text-blue-400">RESET</button>
                      </div>
                      <input
                        type="range" min={adj.min} max={adj.max} step={adj.step}
                        value={(recipe as any)[adj.key]}
                        onChange={(e) => updateRecipe({ [adj.key]: Number(e.target.value) })}
                        className="w-full accent-blue-600 h-1.5 bg-[var(--border)] rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-[var(--border)] hidden md:block" />
              <div className="w-full md:w-64">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6">Speed & Audio</p>
                <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}

          {activeModule === "rotate" && (
            <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6 text-center">Orientation</p>
              <RotateControl recipe={recipe} onChange={updateRecipe} />
            </div>
          )}

          {activeModule === "export" && (
            <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6">Container Format</p>
                <FormatSelector recipe={recipe} onChange={updateRecipe} />
              </div>
              <div className="w-px bg-[var(--border)] hidden md:block" />
              <div className="w-full md:w-64">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-6">Export Quality</p>
                <ExportSettings recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}
        </div>

        {/* Main Dock */}
        <div className={cn(
          "bg-[var(--surface)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[2.5rem] p-2 flex items-center shadow-2xl transition-all duration-500",
          !file && "opacity-20 pointer-events-none scale-95"
        )}>
          <div className="flex-1 flex items-center justify-center gap-1 p-1">
            {[
              { id: "resize", icon: <Layers size={18} />, label: "Resize" },
              { id: "trim", icon: <Scissors size={18} />, label: "Trim" },
              { id: "color", icon: <SlidersHorizontal size={18} />, label: "Color" },
              { id: "rotate", icon: <RotateCw size={18} />, label: "Rotate" },
              { id: "export", icon: <Crop size={18} />, label: "Export Settings" },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveModule(activeModule === tool.id ? null : tool.id as any)}
                className={cn(
                  "flex items-center gap-3 px-8 py-3.5 rounded-[2rem] transition-all relative group",
                  activeModule === tool.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105" 
                    : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                )}
              >
                {tool.icon}
                <span className="hidden md:block text-xs font-bold uppercase tracking-widest">{tool.label}</span>
                {activeModule === tool.id && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={resetSettings}
              className="p-4 text-[var(--muted)] hover:text-red-500 transition-colors"
              title="Reset All"
            >
              <RotateCw size={18} />
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
