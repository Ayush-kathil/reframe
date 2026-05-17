/* eslint-disable react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from "react";
import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Dispatch, SetStateAction } from "react";

interface Props {
  file: File | null;
  recipe: EditRecipe;
  playing?: boolean;
  onTimeUpdate?: Dispatch<SetStateAction<number>>;
  onDurationChange?: Dispatch<SetStateAction<number>>;
}

export default function VideoPreview({ file, recipe, playing, onTimeUpdate, onDurationChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // stable handler reference (avoids re-attaching logic unnecessarily)
  const onLoadedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!file) return;

    setIsLoading(true);
    const id = ++lastId.current;
    const url = URL.createObjectURL(file);

    // cleanup previous object URL safely
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = url;

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();

    // define handler once per effect run
    const handleLoaded = () => {
      if (lastId.current !== id) return;
      video.play().catch(() => {});
    };

    onLoadedRef.current = handleLoaded;

    video.addEventListener("loadeddata", handleLoaded);

    if (onTimeUpdate) {
      video.addEventListener("timeupdate", () => onTimeUpdate(video.currentTime));
    }
    if (onDurationChange) {
      video.addEventListener("loadedmetadata", () => onDurationChange(video.duration));
    }

    return () => {
      // cleanup event listener safely
      if (onLoadedRef.current) {
        video.removeEventListener("loadeddata", onLoadedRef.current);
        onLoadedRef.current = null;
      }

      // stop playback safely
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      // revoke only if still current
      if (urlRef.current === url) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing]);

  if (!file) return null;

  // Calculate CSS filters based on recipe
  const filters = [
    `brightness(${1 + recipe.brightness})`,
    `contrast(${recipe.contrast})`,
    `saturate(${recipe.saturation})`,
    `grayscale(${recipe.grayscale})`,
    `sepia(${recipe.sepia})`,
    `blur(${recipe.blur}px)`,
    `hue-rotate(${recipe.hueRotate}deg)`,
    `opacity(${recipe.opacity})`,
    recipe.invert ? "invert(1)" : "",
    recipe.sharpen > 0 ? "url(#sharpen-filter)" : "",
    (recipe.colorBalanceR !== 1 || recipe.colorBalanceG !== 1 || recipe.colorBalanceB !== 1) ? "url(#color-balance-filter)" : "",
  ].filter(Boolean).join(" ");

  // Handle rotation & flip transform
  const transform = [
    `rotate(${recipe.rotate}deg)`,
    recipe.flipH ? "scaleX(-1)" : "",
    recipe.flipV ? "scaleY(-1)" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="relative w-full flex flex-col items-center gap-4 animate-fade-in">
      {/* SVG Filters for Live Preview (Sharpening & RGB Color Balance) */}
      <svg className="absolute w-0 h-0 pointer-events-none" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          {recipe.sharpen > 0 && (
            <filter id="sharpen-filter">
              <feConvolveMatrix
                order="3"
                preserveAlpha="true"
                kernelMatrix={`0 -${recipe.sharpen} 0 -${recipe.sharpen} ${1 + 4 * recipe.sharpen} -${recipe.sharpen} 0 -${recipe.sharpen} 0`}
              />
            </filter>
          )}
          {(recipe.colorBalanceR !== 1 || recipe.colorBalanceG !== 1 || recipe.colorBalanceB !== 1) && (
            <filter id="color-balance-filter">
              <feColorMatrix
                type="matrix"
                values={`
                  ${recipe.colorBalanceR} 0 0 0 0
                  0 ${recipe.colorBalanceG} 0 0 0
                  0 0 ${recipe.colorBalanceB} 0 0
                  0 0 0 1 0
                `}
              />
            </filter>
          )}
        </defs>
      </svg>

      <div 
        className="relative w-full rounded-2xl overflow-hidden bg-black/40 backdrop-blur-sm border border-[var(--border)] shadow-2xl transition-all duration-500 ease-out flex items-center justify-center"
        style={{ 
          aspectRatio: "16/9",
          maxHeight: "60vh",
          minHeight: "300px"
        }}
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-gray-800/50 flex items-center justify-center"
            aria-label="Loading video preview"
          >
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          controls
          className={cn(
            "max-w-full max-h-full object-contain transition-all duration-300",
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}
          style={{ 
            filter: filters,
            transform: transform
          }}
          onLoadedData={() => setIsLoading(false)}
          playsInline
        />
      </div>
      
      <div className="w-full max-w-2xl px-4 py-2 bg-[var(--surface)]/50 backdrop-blur-md rounded-full border border-[var(--border)] flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
        <div className="flex items-center gap-4">
          <span>Live Preview</span>
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <span>{recipe.preset.replace(/-/g, ' ')}</span>
          <span className="opacity-40">|</span>
          <span>{recipe.format.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}


