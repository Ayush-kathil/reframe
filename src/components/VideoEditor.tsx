"use client";
import { useState, useMemo } from "react";
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
import TextControl from "./TextControl";
import EffectsControl from "./EffectsControl";
import {
  Video, LayoutTemplate, Type, Music, 
  Sparkles, ArrowRightLeft, Undo2, Redo2, 
  Download, Play, Pause, Maximize2, 
  Volume2, Settings, HelpCircle, Layout,
  Layers, Command, RotateCcw
} from "lucide-react";

export default function VideoEditor() {
  const {
    file, duration: totalDuration, recipe, status, progress,
    result, error, updateRecipe,
    handleFileSelect, handleExport, cancelExport, reset,
  } = useVideoEditor();
  
  const [activeTab, setActiveTab] = useState<string>("media");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const isProcessing = status === "loading-engine" || status === "exporting";

  const navigation = useMemo(() => [
    { id: "media", icon: <Video size={18} />, label: "Media" },
    { id: "templates", icon: <LayoutTemplate size={18} />, label: "Canvas" },
    { id: "text", icon: <Type size={18} />, label: "Typography" },
    { id: "effects", icon: <Sparkles size={18} />, label: "Effects" },
    { id: "audio", icon: <Music size={18} />, label: "Audio" },
    { id: "transitions", icon: <ArrowRightLeft size={18} />, label: "Motion" },
  ], []);

  return (
    <div className="h-screen w-full flex bg-[var(--bg)] text-[var(--text)] overflow-hidden transition-google select-none font-sans">
      <ExportOverlay status={status} progress={progress} onCancel={cancelExport} error={error} />

      {/* ── Formal Navigation Rail ── */}
      <aside className="w-[76px] glass-studio border-r flex flex-col items-center py-6 z-50">
        <div className="w-10 h-10 bg-[var(--text)] text-[var(--bg)] rounded-xl flex items-center justify-center mb-10 shadow-lg active:scale-95 transition-google cursor-pointer">
          <Command size={20} />
        </div>
        
        <nav className="flex-1 w-full px-2.5 space-y-3">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "sidebar-item group",
                activeTab === item.id && "sidebar-item-active"
              )}
            >
              <div className="transition-google group-hover:scale-110">
                {item.icon}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6">
          <ThemeToggle />
          <button className="p-3 text-[var(--muted)] hover:text-[var(--text)] transition-google">
            <HelpCircle size={18} />
          </button>
        </div>
      </aside>

      {/* ── Studio Canvas ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--canvas)] relative transition-google">
        
        {/* Semantic Header */}
        <header className="h-14 glass-studio border-b flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)] flex items-center gap-2">
              <Layers size={14} className="text-[var(--muted)]" />
              <span className="text-xs font-bold tracking-tight">{file ? file.name : "Untitled Sequence"}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-google"><Undo2 size={16} /></button>
              <button className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-google"><Redo2 size={16} /></button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the current sequence? All edits will be lost.")) {
                  reset();
                }
              }}
              disabled={!file || isProcessing}
              className={cn(
                "p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-google",
                (!file || isProcessing) && "opacity-30 cursor-not-allowed"
              )}
              title="Reset Sequence"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={handleExport}
              disabled={!file || isProcessing}
              className={cn(
                "btn-primary flex items-center gap-2 py-2 px-6 text-xs uppercase tracking-widest",
                (!file || isProcessing) && "opacity-50 grayscale cursor-not-allowed shadow-none"
              )}
            >
              {isProcessing ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {isProcessing ? "Rendering" : "Download Video"}
            </button>
          </div>
        </header>

        {/* Viewport Core */}
        <div className="flex-1 relative flex items-center justify-center p-8 lg:p-16 overflow-hidden">
          {/* Ambient Light Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[800px] h-[500px] bg-blue-500 rounded-full ambient-glow transition-all duration-1000" 
                 style={{ opacity: file ? 0.15 : 0 }} />
          </div>

          <div className="relative w-full h-full max-w-[1200px] flex items-center justify-center animate-scale z-10">
            {status === "done" && result ? (
              <DownloadResult result={result} onReset={reset} />
            ) : (
              <div className="relative group">
                <VideoPreview 
                  file={file} 
                  recipe={recipe} 
                  playing={isPlaying}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setVideoDuration}
                />
                
                {/* HUD: Contextual Controls */}
                {file && status !== "done" && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-google shadow-xl"
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                       <div className="flex items-center justify-between text-[8px] font-black font-mono text-white/50 uppercase tracking-widest">
                          <span>{Math.floor(currentTime)}s</span>
                          <span>{Math.floor(videoDuration)}s</span>
                       </div>
                       <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(currentTime/videoDuration)*100}%` }} />
                       </div>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <button className="p-2 text-white/50 hover:text-white transition-google"><Volume2 size={16} /></button>
                    <button className="p-2 text-white/50 hover:text-white transition-google"><Maximize2 size={16} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pro Timeline Interface */}
        <footer className="h-20 glass-studio border-t flex items-center px-8 gap-10 z-40">
           <div className="flex items-center gap-3 shrink-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="label-mono">Master Timeline</span>
           </div>
           <div className="flex-1 max-w-4xl">
              <TrimControl 
                duration={totalDuration} 
                trimStart={recipe.trimStart} 
                trimEnd={recipe.trimEnd} 
                onChange={updateRecipe} 
              />
           </div>
           <div className="flex items-center gap-4 shrink-0">
              <div className="text-[11px] font-mono font-bold text-[var(--muted)]">
                 <span className="text-[var(--text)]">{Math.floor(currentTime).toString().padStart(2, '0')}</span>
                 <span className="opacity-40"> : 00 : 00</span>
              </div>
              <button className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-google">
                 <Settings size={16} />
              </button>
           </div>
        </footer>
      </main>

      {/* ── Property Inspector ── */}
      <aside className="w-[360px] glass-studio border-l overflow-y-auto custom-scrollbar z-40 animate-in slide-in-from-right duration-500">
        <div className="p-8 space-y-10 pb-40">
          
          <div className="space-y-1 animate-entrance">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">Inspector</h2>
            <div className="h-0.5 w-8 bg-[var(--accent-cta)] rounded-full" />
          </div>

          {activeTab === "media" && (
            <div className="space-y-8 animate-entrance">
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight">Sequence Assets</h3>
                <p className="text-xs text-[var(--muted)]">Manage your source high-fidelity media.</p>
              </div>
              
              <FileUpload onFileSelect={handleFileSelect} file={file} isProcessing={isProcessing} />
              
              {file && (
                <div className="p-6 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl space-y-4 animate-scale">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-[var(--muted)]">Encoding</span>
                    <span>{file.name.split('.').pop()?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-[var(--muted)]">Resolution</span>
                    <span>4K Native</span>
                  </div>
                  <button 
                    onClick={reset}
                    className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-google"
                  >
                    Evict Asset
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="space-y-8 animate-entrance">
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight">Canvas Layout</h3>
                <p className="text-xs text-[var(--muted)]">Define the spatial resolution of the output.</p>
              </div>
              <PresetSelector recipe={recipe} onChange={updateRecipe} />
            </div>
          )}

          {activeTab === "text" && (
             <div className="animate-entrance">
               <TextControl recipe={recipe} onChange={updateRecipe} />
             </div>
          )}

          {activeTab === "effects" && (
            <div className="animate-entrance">
              <EffectsControl recipe={recipe} onChange={updateRecipe} />
            </div>
          )}

          {activeTab === "transitions" && (
            <div className="space-y-8 animate-entrance">
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight">Spatial Transforms</h3>
                <p className="text-xs text-[var(--muted)]">Adjust the geometry of the viewport.</p>
              </div>
              <div className="space-y-10 p-8 bg-[var(--surface-hover)] border border-[var(--border)] rounded-[2.5rem]">
                <div className="space-y-4">
                  <p className="label-mono">Framing Logic</p>
                  <FramingControl recipe={recipe} onChange={updateRecipe} />
                </div>
                
                <div className="w-full h-px bg-[var(--border)]" />
                
                <div className="space-y-4">
                  <p className="label-mono">Mirroring Axis</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateRecipe({ flipH: !recipe.flipH })}
                      className={cn(
                        "py-4 rounded-xl border flex flex-col items-center gap-3 transition-google",
                        recipe.flipH ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)]"
                      )}
                    >
                      <ArrowRightLeft size={16} />
                      <span className="text-[9px] font-bold uppercase">Horizontal</span>
                    </button>
                    <button
                      onClick={() => updateRecipe({ flipV: !recipe.flipV })}
                      className={cn(
                        "py-4 rounded-xl border flex flex-col items-center gap-3 transition-google",
                        recipe.flipV ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)]"
                      )}
                    >
                      <Layout size={16} className="rotate-180" />
                      <span className="text-[9px] font-bold uppercase">Vertical</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-px bg-[var(--border)]" />
                <div className="space-y-4">
                   <p className="label-mono">Angular Rotation</p>
                   <RotateControl recipe={recipe} onChange={updateRecipe} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "audio" && (
            <div className="space-y-8 animate-entrance">
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight">Sonic Master</h3>
                <p className="text-xs text-[var(--muted)]">Adjust timing and gain for the audio stream.</p>
              </div>
              <div className="space-y-10 p-8 bg-[var(--surface-hover)] border border-[var(--border)] rounded-3xl">
                 <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
                 
                 <div className="w-full h-px bg-[var(--border)]" />
                 
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="label-mono">Master Gain</span>
                      <span className="text-[10px] font-mono font-bold">{(recipe.volume * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min={0} max={2} step={0.1}
                      value={recipe.volume}
                      onChange={(e) => updateRecipe({ volume: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
              </div>
            </div>
          )}

          {file && (
            <div className="pt-10 border-t border-[var(--border)] space-y-8 animate-entrance">
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-tight">Output Stream</h3>
                <p className="text-xs text-[var(--muted)]">Configure the final delivery specifications.</p>
              </div>
              <div className="p-8 bg-[var(--surface-hover)] border border-[var(--border)] rounded-3xl space-y-10">
                 <FormatSelector recipe={recipe} onChange={updateRecipe} />
                 <ExportSettings recipe={recipe} onChange={updateRecipe} />
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
