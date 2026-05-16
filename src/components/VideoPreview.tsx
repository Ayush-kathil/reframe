import { useEffect, useRef, useState } from "react";
import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  file: File | null;
  recipe: EditRecipe;
}

export default function VideoPreview({ file, recipe }: Props) {
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

  if (!file) return null;

  // Map presets to aspect ratios
  const getAspectRatio = (preset: string) => {
    if (preset.includes("16-9")) return "16/9";
    if (preset.includes("9-16")) return "9/16";
    if (preset.includes("1-1")) return "1/1";
    if (preset.includes("4-5")) return "4/5";
    if (preset.includes("4-3")) return "4/3";
    if (preset.includes("21-9")) return "21/9";
    return "16/9"; // Default
  };

  // Calculate CSS filters based on recipe
  const filters = [
    `brightness(${1 + recipe.brightness})`,
    `contrast(${recipe.contrast})`,
    `saturate(${recipe.saturation})`,
  ].join(" ");

  // Handle rotation transform
  const transform = `rotate(${recipe.rotate}deg)`;

  return (
    <div className="relative w-full flex flex-col items-center gap-8">
      <div 
        className="relative rounded-3xl overflow-hidden bg-black/60 backdrop-blur-xl border border-[var(--border)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all duration-700 ease-in-out flex items-center justify-center group"
        style={{ 
          aspectRatio: getAspectRatio(recipe.preset),
          maxHeight: "65vh",
          width: "auto",
          maxWidth: "100%"
        }}
      >
        {isLoading && (
          <div
            className="absolute inset-0 z-10 bg-[var(--bg)]/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500"
            aria-label="Loading video preview"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Initializing Preview</p>
            </div>
          </div>
        )}
        
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          controls
          className={cn(
            "w-full h-full transition-all duration-500 ease-in-out",
            recipe.framing === "fill" ? "object-cover" : "object-contain",
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}
          style={{ 
            filter: filters,
            transform: transform
          }}
          onLoadedData={() => setIsLoading(false)}
          playsInline
        />

        {/* Framing Indicator */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      <div className="flex items-center gap-4 px-6 py-3 bg-[var(--surface)]/80 backdrop-blur-2xl rounded-full border border-[var(--border)] shadow-xl animate-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Live</span>
          </div>
          <div className="w-px h-3 bg-[var(--border)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
            {recipe.preset.replace(/-/g, ' ')}
          </span>
        </div>
        
        <div className="w-px h-3 bg-[var(--border)]" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <span>{recipe.format.toUpperCase()}</span>
          <span>•</span>
          <span>{recipe.framing}</span>
        </div>
      </div>
    </div>
  );
}
