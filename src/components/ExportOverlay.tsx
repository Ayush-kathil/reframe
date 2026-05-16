"use client";

import FocusTrap from "focus-trap-react";
import { useEffect, useRef, useCallback } from "react";
import { ExportStatus } from "@/lib/types";
import { AlertTriangle, Zap } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";
import { cn } from "@/lib/utils";

interface Props {
  status: ExportStatus;
  progress: number;
  onCancel?: () => void;
}

export default function ExportOverlay({ status, progress, onCancel, error }: Props & { error?: string | null }) {
  const visible = status === "loading-engine" || status === "exporting" || status === "error";
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusAnchorRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel?.();
    }
  }, [onCancel]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("keydown", handleKeyDown);
    previousFocusRef.current = document.activeElement as HTMLElement;
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleKeyDown]);

  if (!visible) return null;

  const isLoading = status === "loading-engine";
  const isError = status === "error";

  return (
    <FocusTrap
      active={visible}
      focusTrapOptions={{
        escapeDeactivates: true,
        clickOutsideDeactivates: false,
        initialFocus: () => focusAnchorRef.current!,
        fallbackFocus: () => focusAnchorRef.current!,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg)]/80 backdrop-blur-2xl transition-studio animate-in fade-in duration-500"
      >
        <div
          className="text-center space-y-10 max-w-md w-full px-10 py-16 bg-[var(--surface)] border border-[var(--border)] rounded-[3rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-studio"
          aria-live="polite"
        >
          <div ref={focusAnchorRef} tabIndex={-1} className="sr-only" />
          
          <div className="mx-auto w-24 h-24 relative">
            {isError ? (
              <div className="w-full h-full bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center animate-bounce">
                <AlertTriangle size={40} />
              </div>
            ) : (
              <LottiePlayer
                animationData={spinnerAnim}
                loop
                autoplay
                className="w-full h-full"
              />
            )}
            {!isError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black font-mono text-[var(--accent)]">{progress}%</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-[var(--text)] uppercase">
              {isError ? "System Failure" : isLoading ? "Initializing Engine" : "Rendering Studio"}
            </h2>
            <p className="text-xs text-[var(--muted)] font-medium leading-relaxed max-w-[280px] mx-auto">
              {isError 
                ? (error || "An unexpected error occurred during processing.")
                : isLoading
                ? "Calibrating the WebAssembly video engine for your device."
                : "Encoding your masterpiece locally. High-performance compute active."}
            </p>
          </div>

          {status === "exporting" && (
            <div className="w-full space-y-4 pt-4">
              <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-indigo-500 rounded-full transition-all duration-500 ease-studio shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">
                Optimizing Stream: {progress}%
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-6 pt-6">
            <button
              type="button"
              onClick={() => onCancel?.()}
              className={cn(
                "smart-button group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-studio",
                isError 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:bg-red-500 hover:text-white hover:border-red-500"
              )}
            >
              <Zap size={14} className={cn("transition-studio group-hover:rotate-12", isError && "fill-current")} />
              {isError ? "Dismiss Error" : "Abort Session"}
            </button>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] opacity-50">
              Press <kbd className="font-mono bg-[var(--surface-hover)] px-1.5 py-0.5 rounded border border-[var(--border)]">ESC</kbd> to exit
            </p>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}