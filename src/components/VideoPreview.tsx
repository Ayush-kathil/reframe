import { useEffect, useRef, useState } from "react";
import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  file: File | null;
  recipe: EditRecipe;
  playing?: boolean;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

export default function VideoPreview({ 
  file, recipe, playing = false, 
  onTimeUpdate, onDurationChange 
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (!file) return;

    setIsLoading(true);
    const id = ++lastId.current;
    const url = URL.createObjectURL(file);

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();

    const handleLoaded = () => {
      if (lastId.current !== id) return;
      onDurationChange?.(video.duration);
    };

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      if (urlRef.current === url) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file, onDurationChange, onTimeUpdate]);

  if (!file) return null;

  const getAspectRatio = (preset: string) => {
    if (preset.includes("16-9")) return "16/9";
    if (preset.includes("9-16")) return "9/16";
    if (preset.includes("1-1")) return "1/1";
    if (preset.includes("4-5")) return "4/5";
    if (preset.includes("4-3")) return "4/3";
    if (preset.includes("21-9")) return "21/9";
    return "16/9";
  };

  const filters = [
    `brightness(${1 + recipe.brightness})`,
    `contrast(${recipe.contrast})`,
    `saturate(${recipe.saturation})`,
    `hue-rotate(${recipe.hueRotate}deg)`,
    `sepia(${recipe.sepia})`,
    `blur(${recipe.blur}px)`,
    `grayscale(${recipe.grayscale})`,
    `invert(${recipe.invert ? 1 : 0})`,
    `opacity(${recipe.opacity})`,
  ].join(" ");

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div 
        className="relative rounded-[2rem] overflow-hidden bg-black video-shadow transition-all duration-700 ease-studio flex items-center justify-center group"
        style={{ 
          aspectRatio: getAspectRatio(recipe.preset),
          maxHeight: "100%",
          maxWidth: "100%",
          width: recipe.preset === "custom" ? "auto" : "100%"
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Syncing Engine</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full transition-all duration-700 ease-studio",
            recipe.framing === "fill" ? "object-cover" : "object-contain",
            isLoading ? "opacity-0 scale-95 blur-xl" : "opacity-100 scale-100 blur-0"
          )}
          style={{ 
            filter: filters,
            transform: `rotate(${recipe.rotate}deg) scaleX(${recipe.flipH ? -1 : 1}) scaleY(${recipe.flipV ? -1 : 1})`
          }}
          onLoadedData={() => setIsLoading(false)}
          playsInline
          muted
        />

        {recipe.text && (
          <div 
            className={cn(
              "absolute inset-0 z-20 flex px-8 py-12 pointer-events-none transition-all duration-500",
              recipe.textPosition === "top" && "items-start justify-center",
              recipe.textPosition === "center" && "items-center justify-center",
              recipe.textPosition === "bottom" && "items-end justify-center"
            )}
          >
            <span 
              className="font-black text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-90 duration-500"
              style={{ 
                color: recipe.textColor,
                fontSize: `${recipe.textFontSize}px`,
                lineHeight: 1.1,
                maxWidth: "90%"
              }}
            >
              {recipe.text}
            </span>
          </div>
        )}

        {recipe.vignette > 0 && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none transition-studio" 
            style={{ 
              background: `radial-gradient(circle, transparent ${100 - recipe.vignette * 50}%, rgba(0,0,0,${recipe.vignette * 0.8}) 100%)` 
            }} 
          />
        )}

        {/* Pro Viewport Guidelines */}
        <div className="absolute inset-0 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-google">
           {/* Rule of Thirds */}
           <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/5" />
              <div className="border-r border-b border-white/5" />
              <div className="border-b border-white/5" />
              <div className="border-r border-b border-white/5" />
              <div className="border-r border-b border-white/5" />
              <div className="border-b border-white/5" />
              <div className="border-r border-white/5" />
              <div className="border-r border-white/5" />
              <div />
           </div>
           
           {/* Safe Zones */}
           <div className="absolute inset-[10%] border border-dashed border-white/10 rounded-2xl" />
           <div className="absolute inset-[20%] border border-dashed border-white/5 rounded-xl" />
        </div>

        <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-[2rem]" />
      </div>
    </div>
  );
}
