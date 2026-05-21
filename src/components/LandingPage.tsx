"use client";

import { Play, Sparkles, Shield, Cpu, Zap, Film } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-bg text-text relative overflow-hidden flex flex-col justify-between py-12 px-6">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Film className="w-6 h-6 text-accent animate-pulse" />
          <span className="font-display text-xl tracking-widest text-text font-bold">REFRAME</span>
        </div>
        <button
          onClick={onStart}
          className="px-4 py-2 border border-border rounded-lg text-xs font-semibold uppercase tracking-wider bg-surface/50 hover:bg-surface transition-all active:scale-95"
        >
          Launch Studio
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto w-full text-center my-auto py-12 z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-[10px] font-bold uppercase tracking-widest mb-6 animate-bounce">
          <Sparkles className="w-3 h-3" />
          Next-Generation Web Video Editor
        </div>
        
        <h1 className="font-display text-5xl sm:text-7xl font-extrabold tracking-tight leading-none mb-6">
          Cinematic Editing. <br />
          <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            Directly in your Browser.
          </span>
        </h1>

        <p className="text-muted text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          A browser-based editor for reframing social videos, trimming timelines, and exporting polished clips without leaving your device.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStart}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-heading text-lg font-bold tracking-widest transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-accent/20 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            ENTER STUDIO
          </button>
          <a
            href="https://github.com/magic-peach/reframe"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 border border-border rounded-xl font-heading text-sm font-semibold tracking-wider hover:bg-surface/50 transition-all cursor-pointer"
          >
            DOCUMENTATION
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="p-6 bg-surface/40 border border-border rounded-xl backdrop-blur-sm">
            <div className="p-2 bg-accent/10 border border-accent/20 text-accent w-fit rounded-lg mb-4">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-2">Real-Time Engine</h3>
            <p className="text-xs text-muted leading-relaxed">
              Experience instant live visual adjustments on frame cropping, rotations, and visual speeds using hardware-accelerated rendering.
            </p>
          </div>

          <div className="p-6 bg-surface/40 border border-border rounded-xl backdrop-blur-sm">
            <div className="p-2 bg-secondary/10 border border-secondary/20 text-secondary w-fit rounded-lg mb-4">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-2">100% Client-Side</h3>
            <p className="text-xs text-muted leading-relaxed">
              Your security is guaranteed. All processing runs locally via Deno-compiled WebAssembly FFmpeg pipelines inside your sandbox.
            </p>
          </div>

          <div className="p-6 bg-surface/40 border border-border rounded-xl backdrop-blur-sm">
            <div className="p-2 bg-tertiary/10 border border-tertiary/20 text-tertiary w-fit rounded-lg mb-4">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-2">Pro Grading Suite</h3>
            <p className="text-xs text-muted leading-relaxed">
              Surgical color controls supporting fine-grained HSL ranges, dynamic vignette filters, RGB channels, and precise speed scaling.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-muted tracking-widest uppercase mt-12 z-10">
        Reframe · Private, fast, web-native video reframing
      </footer>
    </div>
  );
}
