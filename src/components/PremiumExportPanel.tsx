"use client";

import { useState } from "react";
import { Download, CheckCircle, AlertCircle, Zap, Settings2, FileText, BarChart3, ArrowRight } from "lucide-react";
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
  onExport,
  onCancel,
  onReset,
}: ExportPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="space-y-6 animate-fade-in">
      {result && status === "done" ? (
        <div className="animate-fade-in">
          <DownloadResult result={result} onReset={onReset} soundOnCompletion={recipe.soundOnCompletion} />
        </div>
      ) : (
        <>
          {/* Config Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Settings */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface">Export Config</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Format Selector */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Output Format</div>
                      <FormatSelector recipe={recipe} onChange={onChange} />
                    </div>

                    {/* Quality Setting */}
                    <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                      <div className="flex justify-between items-center">
                        <label htmlFor="quality" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quality</label>
                        <span className="text-xs font-mono font-bold text-accent">CRF {recipe.quality}</span>
                      </div>
                      <input
                        id="quality"
                        type="range"
                        min={0}
                        max={51}
                        step={1}
                        value={recipe.quality}
                        onChange={(e) => onChange({ quality: parseInt(e.target.value) })}
                        className="w-full h-2 accent-accent cursor-pointer rounded-lg appearance-none bg-surface-container-high"
                      />
                      <div className="flex justify-between text-[10px] text-on-surface-variant/60">
                        <span>Best</span>
                        <span>Balanced</span>
                        <span>Smallest</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/70 bg-surface-container-low/50 rounded p-2 border border-outline-variant/10">
                        Lower values = better quality but larger file size
                      </p>
                    </div>

                    {/* Advanced Options */}
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full text-left text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-2 transition-all bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <Settings2 className="w-3 h-3" />
                      Advanced Options
                      <span className={`ml-auto transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>↓</span>
                    </button>

                    {showAdvanced && (
                      <div className="space-y-3 pt-3 border-t border-outline-variant/20 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="completion-sound"
                            checked={recipe.soundOnCompletion}
                            onChange={(e) => onChange({ soundOnCompletion: e.target.checked })}
                            className="w-4 h-4 rounded border-2 border-outline-variant/30 accent-primary cursor-pointer"
                          />
                          <label htmlFor="completion-sound" className="text-xs font-semibold text-on-surface-variant cursor-pointer">
                            Sound on completion
                          </label>
                        </div>
                        <p className="text-[9px] text-on-surface-variant/60 ml-6">
                          Play a notification when export finishes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Columns: Preview & Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Preview Card */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border-2 border-primary/30 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ready to Export</p>
                    <p className="text-sm font-bold text-on-surface">Your video composition</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-primary/20">
                  <div className="bg-surface-container/50 rounded-lg p-3">
                    <p className="text-[10px] text-on-surface-variant/70 uppercase font-bold tracking-wider">Format</p>
                    <p className="text-sm font-bold text-primary mt-1">{recipe.format.toUpperCase()}</p>
                  </div>
                  <div className="bg-surface-container/50 rounded-lg p-3">
                    <p className="text-[10px] text-on-surface-variant/70 uppercase font-bold tracking-wider">Quality</p>
                    <p className="text-sm font-bold text-secondary mt-1">CRF {recipe.quality}</p>
                  </div>
                  <div className="bg-surface-container/50 rounded-lg p-3">
                    <p className="text-[10px] text-on-surface-variant/70 uppercase font-bold tracking-wider">Speed</p>
                    <p className="text-sm font-bold text-tertiary mt-1">{recipe.speed}x</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}
              </div>

              {/* Progress Section */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-6 space-y-4">
                {isProcessing ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-on-surface">Rendering Progress</span>
                        <span className="text-2xl font-black text-accent font-mono">{progress}%</span>
                      </div>
                      
                      {/* Animated Progress Bar */}
                      <div className="relative h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/20">
                        <div
                          className="h-full bg-gradient-to-r from-accent via-primary to-accent rounded-full transition-all duration-300 shadow-lg shadow-accent/30"
                          style={{ width: `${progress}%` }}
                        />
                        <div className="absolute inset-0 opacity-30 animate-pulse rounded-full" style={{
                          background: 'linear-gradient(90deg, transparent, white, transparent)',
                        }} />
                      </div>
                    </div>

                    {/* Processing Status */}
                    <div className="bg-surface-container-low/50 rounded-lg p-3 space-y-2 border border-outline-variant/10">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                        {status === "loading-engine" 
                          ? "🔧 Initializing WASM engine..."
                          : progress < 30 ? "📹 Transcoding video..."
                          : progress < 60 ? "🎨 Applying effects..."
                          : progress < 90 ? "🔊 Processing audio..."
                          : "📦 Finalizing export..."}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/60">
                        {status === "loading-engine" 
                          ? "This may take a moment on first use"
                          : "Processing your video with FFmpeg.wasm"}
                      </p>
                    </div>

                    <button
                      onClick={onCancel}
                      className="w-full py-2 px-4 text-xs font-semibold uppercase tracking-wider text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all border-2 border-red-500/20 bg-transparent cursor-pointer"
                    >
                      Cancel Export
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onExport}
                    disabled={isProcessing}
                    className="w-full py-4 px-4 rounded-xl font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 bg-gradient-to-r from-accent to-primary text-on-primary hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-5 h-5" />
                    Launch Export
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-surface-container-low/50 rounded-2xl border border-primary/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Pro Tips</span>
            </div>
            <ul className="space-y-2 text-[10px] text-on-surface-variant/70">
              <li className="flex items-start gap-2">
                <span>→</span>
                <span>Higher CRF values create smaller files but with lower quality. CRF 18-23 is recommended.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>→</span>
                <span>MP4 format offers the best compatibility across devices and platforms.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>→</span>
                <span>First export may take longer as FFmpeg.wasm is initialized from your browser.</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
