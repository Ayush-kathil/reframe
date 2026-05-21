"use client";

import FocusTrap from "focus-trap-react";
import { useEffect, useRef, useCallback } from "react";
import { ExportStatus } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
  onCancel?: () => void;
}

export default function ExportOverlay({ status, progress, onCancel }: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusAnchorRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    },
    [onCancel]
  );

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

  useEffect(() => {
    if (!visible && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const isLoading = status === "loading-engine";

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
        tabIndex={-1}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
      >
        <div
          ref={focusAnchorRef}
          tabIndex={-1}
          className="sr-only"
          aria-hidden="true"
        />
        
        {/* Export Modal Panel from Stitch */}
        <div className="w-full max-w-[640px] bg-surface-container-low border border-outline-variant shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[921px] animate-fade-in">
          {/* Modal Header */}
          <div className="h-10 bg-surface-container-high px-4 flex items-center justify-between border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">
                ios_share
              </span>
                <span className="font-label-caps text-label-caps text-on-surface">
                REFRAME EXPORT
              </span>
            </div>
            <button 
              className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => onCancel?.()}
            >
              close
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-8">
            {/* Preview Section */}
            <div className="flex gap-6">
              <div className="w-1/3 aspect-video bg-surface-container-lowest rounded border border-outline-variant relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Preview Frame"
                  className="w-full h-full object-cover rounded opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCz88d7TToZx0SRg5dp2x0iHiDV4qWn0zOny3lHQq0Cis6OSIlvTnHeFTXYufBR74bTutVwORkHrXqA7cF4aQ4f79A4JeItamMSO3g62pwP-xGA4mFB0rjpA8XFljxhoe8nEf8SJJJmBIZlEhqmDLxwtHwoLQrXfvoHyuPKw305b_UILnLn4DsH17cFTIlmD6wnY_NAgdfNUeHs6gGxdAXa8YcBwBh8oG5I0NNlpzoHpMqi1Em-xTByX2lB0I0E5McnxD2QyigZrbQ"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="material-symbols-outlined text-white text-[32px]">
                    play_arrow
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Reframe Export
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant font-label-mono text-label-mono rounded">
                    3840 x 2160
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant font-label-mono text-label-mono rounded">
                    59.94 FPS
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant font-label-mono text-label-mono rounded">
                    00:12:44:12
                  </span>
                </div>
              </div>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {/* Format Selection */}
              <div className="space-y-3">
                <span className="font-label-caps text-label-caps text-outline-variant block">
                  FILE FORMAT
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button className="flex items-center justify-between px-3 py-2 bg-surface-container-high border-2 border-primary rounded text-on-surface">
                    <div className="flex flex-col items-start">
                      <span className="font-body-md">H.264 (MPEG-4)</span>
                      <span className="text-[10px] text-outline-variant">
                        Standard high-quality delivery
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-primary">
                      check_circle
                    </span>
                  </button>
                  <button className="flex items-center justify-between px-3 py-2 bg-surface-container border border-outline-variant rounded text-on-surface-variant hover:border-outline transition-colors">
                    <div className="flex flex-col items-start">
                      <span className="font-body-md">Apple ProRes 422</span>
                      <span className="text-[10px] text-outline-variant">
                        High-fidelity production master
                      </span>
                    </div>
                  </button>
                  <button className="flex items-center justify-between px-3 py-2 bg-surface-container border border-outline-variant rounded text-on-surface-variant hover:border-outline transition-colors">
                    <div className="flex flex-col items-start">
                      <span className="font-body-md">HEVC (H.265)</span>
                      <span className="text-[10px] text-outline-variant">
                        Maximum compression efficiency
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Technical Params */}
              <div className="space-y-6">
                {/* Resolution */}
                <div className="space-y-3">
                  <span className="font-label-caps text-label-caps text-outline-variant block">
                    RESOLUTION
                  </span>
                  <div className="relative">
                    <select className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-on-surface focus:border-primary outline-none appearance-none cursor-pointer" defaultValue="1920 x 1080 (1080p HD)">
                      <option>3840 x 2160 (4K UHD)</option>
                      <option>1920 x 1080 (1080p HD)</option>
                      <option>1280 x 720 (720p HD)</option>
                      <option>Custom...</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Quality Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-label-caps text-label-caps text-outline-variant block">
                      TARGET BITRATE
                    </span>
                    <span className="font-label-mono text-label-mono text-secondary">
                      32 Mbps
                    </span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <div className="absolute h-1 w-full bg-surface-container-highest rounded-full"></div>
                    <div className="absolute h-1 w-[65%] bg-secondary rounded-full"></div>
                    <div className="absolute w-3 h-3 bg-on-surface border-2 border-secondary rounded-full left-[65%] -ml-1.5 shadow-md"></div>
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-3">
                  <span className="font-label-caps text-label-caps text-outline-variant block">
                    LOCATION
                  </span>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-body-sm text-on-surface-variant overflow-hidden whitespace-nowrap overflow-ellipsis">
                      /Users/reframe/Exports/
                    </div>
                    <button className="bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded hover:bg-surface-container-highest transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        folder_open
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress & Stats Area */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="font-label-caps text-[9px] text-outline-variant">
                    ESTIMATED FILE SIZE
                  </span>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    1.42 GB
                  </p>
                </div>
                <div className="text-right space-y-1 flex flex-col items-end gap-1">
                  <span className="font-label-caps text-[9px] text-outline-variant">
                    STATUS
                  </span>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4">
                        <LottiePlayer
                          animationData={spinnerAnim}
                          loop
                          autoplay
                          aria-hidden="true"
                        />
                      </div>
                      <p className="font-label-mono text-label-mono text-primary uppercase">
                        Downloading engine...
                      </p>
                    </div>
                  ) : (
                    <p className="font-label-mono text-label-mono text-primary uppercase">
                      Exporting...
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-label-mono text-on-surface-variant">
                  <span>
                    {isLoading ? "Fetching ffmpeg.wasm" : "Processing frames"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-surface-container-high flex items-center justify-between border-t border-outline-variant">
            <button
              onClick={() => onCancel?.()}
              className="px-6 py-2 rounded font-label-caps text-label-caps text-on-surface hover:bg-surface-container-highest transition-colors border border-outline-variant"
            >
              CANCEL
            </button>
            <div className="flex gap-3">
              <button disabled className="px-6 py-2 rounded font-label-caps text-label-caps text-on-surface hover:bg-surface-container-highest transition-colors border border-outline-variant opacity-50 cursor-not-allowed">
                ADD TO QUEUE
              </button>
              <button disabled className="px-10 py-2 bg-primary rounded font-label-caps text-label-caps text-on-primary hover:bg-primary-container transition-all shadow-lg shadow-primary/10 opacity-50 cursor-not-allowed">
                EXPORTING
              </button>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}