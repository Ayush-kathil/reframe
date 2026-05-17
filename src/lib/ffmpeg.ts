import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult } from "./types";
import { getPresetById } from "./presets";
import { simd } from "wasm-feature-detect";

const CORE_VERSION = "0.12.10";
const JSDELIVR_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;
const UNPKG_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpegInstance: FFmpeg | null = null;

export class FFmpegLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FFmpegLoadError";
  }
}

async function tryLoad(ffmpeg: FFmpeg, baseUrl: string, isSimd: boolean, signal?: AbortSignal) {
  const coreName = isSimd ? "ffmpeg-core-simd" : "ffmpeg-core";
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseUrl}/${coreName}.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseUrl}/${coreName}.wasm`, "application/wasm"),
  }, { signal });
}

export async function loadFFmpeg(signal?: AbortSignal): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = ffmpegInstance ?? new FFmpeg();
  ffmpegInstance = ffmpeg;

  // We'll try multiple loading strategies for maximum reliability
  const strategies = [
    { base: JSDELIVR_BASE, preferSimd: true },
    { base: UNPKG_BASE, preferSimd: true },
    { base: JSDELIVR_BASE, preferSimd: false },
    { base: UNPKG_BASE, preferSimd: false },
  ];

  let lastError: any = null;

  for (const strategy of strategies) {
    try {
      const isSimdSupported = strategy.preferSimd ? await simd() : false;
      await tryLoad(ffmpeg, strategy.base, isSimdSupported, signal);
      console.log(`FFmpeg loaded successfully using ${strategy.base} (${isSimdSupported ? 'SIMD' : 'Standard'})`);
      return ffmpeg;
    } catch (err) {
      lastError = err;
      console.warn(`FFmpeg failed to load from ${strategy.base}. Retrying next strategy...`);
      continue;
    }
  }

  ffmpegInstance = null;
  throw new FFmpegLoadError(
    "FFmpeg failed to initialize. This usually happens due to a network restriction or missing SharedArrayBuffer headers. " +
    (lastError?.message || "")
  );
}

/** Terminates the active FFmpeg instance and releases its memory. */
export function terminateFFmpeg() {
  ffmpegInstance?.terminate();
  ffmpegInstance = null;
}

/** Generates a unique session ID used to isolate FFmpeg file names across concurrent exports. */
function buildSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Builds the FFmpeg -vf filter chain string from the current recipe settings. */
function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
  const filters: string[] = [];

  if (recipe.trimStart > 0 || recipe.trimEnd !== null) {
    const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
    filters.push(`trim=start=${recipe.trimStart}:end=${end}`);
    filters.push("setpts=PTS-STARTPTS");
  }

  if (recipe.rotate === 90) {
    filters.push("transpose=1");
  } else if (recipe.rotate === 180) {
    filters.push("transpose=1,transpose=1");
  } else if (recipe.rotate === 270) {
    filters.push("transpose=2");
  }

  if (recipe.framing === "fit") {
    filters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
      `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black`
    );
  } else {
    filters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase`,
      `crop=${targetW}:${targetH}`
    );
  }

  if (recipe.speed !== 1) {
    const pts = (1 / recipe.speed).toFixed(4);
    filters.push(`setpts=${pts}*PTS`);
  }

  // Color & Effects
  filters.push(`eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`);
  
  if (recipe.hueRotate !== 0) filters.push(`hue=h=${recipe.hueRotate}`);
  if (recipe.sepia > 0) filters.push(`colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`);
  if (recipe.grayscale > 0) filters.push(`colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3`);
  if (recipe.invert) filters.push("negate");
  if (recipe.flipH) filters.push("hflip");
  if (recipe.flipV) filters.push("vflip");
  if (recipe.blur > 0) filters.push(`boxblur=${recipe.blur}:1`);
  if (recipe.sharpen > 0) filters.push(`unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=${recipe.sharpen}`);
  if (recipe.noise > 0) filters.push(`noise=alls=${recipe.noise}:allf=t+u`);
  if (recipe.vignette > 0) filters.push(`vignette='PI/4*${recipe.vignette}'`);
  
  if (recipe.colorBalanceR !== 1 || recipe.colorBalanceG !== 1 || recipe.colorBalanceB !== 1) {
    filters.push(`colorbalance=rm=${recipe.colorBalanceR-1}:gm=${recipe.colorBalanceG-1}:bm=${recipe.colorBalanceB-1}`);
  }

  if (recipe.opacity < 1) filters.push(`format=rgba,colorchannelmixer=aa=${recipe.opacity}`);

  return filters.join(",");
}

/** Builds an atempo filter chain for the given playback speed, chaining multiple filters for speeds outside the 0.5–2.0 range. */
export function buildAudioFilter(recipe: EditRecipe): string {
  const filters: string[] = [];
  
  if (recipe.speed !== 1) {
    let currentSpeed = recipe.speed;
    const speedFilters: string[] = [];
    
    if (currentSpeed < 0.5) {
      while (currentSpeed < 0.5) {
        speedFilters.push("atempo=0.5");
        currentSpeed = currentSpeed / 0.5;
      }
      if (currentSpeed !== 1) {
        speedFilters.push(`atempo=${Number(currentSpeed.toFixed(4))}`);
      }
    } else if (currentSpeed > 2.0) {
      while (currentSpeed > 2.0) {
        speedFilters.push("atempo=2.0");
        currentSpeed = currentSpeed / 2.0;
      }
      if (currentSpeed !== 1) {
        speedFilters.push(`atempo=${Number(currentSpeed.toFixed(4))}`);
      }
    } else {
      speedFilters.push(`atempo=${Number(currentSpeed.toFixed(4))}`);
    }
    
    filters.push(speedFilters.join(","));
  }

  if (recipe.volume !== 1) {
    filters.push(`volume=${recipe.volume}`);
  }

  return filters.join(",");
}

function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const sessionId = buildSessionId();
  let targetW: number, targetH: number;
  if (recipe.preset === "custom") {
    targetW = recipe.customWidth;
    targetH = recipe.customHeight;
  } else {
    const preset = getPresetById(recipe.preset);
    targetW = preset?.width ?? 1920;
    targetH = preset?.height ?? 1080;
  }

  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const ext = file.name.split(".").pop() ?? "mp4";
  const inputName = `input_${sessionId}.${ext}`;

  const getOutputConfig = (format: string) => {
    switch (format) {
      case "webm":
        return { filename: `output_${sessionId}.webm`, mimeType: "video/webm" };
      case "mkv":
        return { filename: `output_${sessionId}.mkv`, mimeType: "video/x-matroska" };
      default: // mp4
        return { filename: `output_${sessionId}.mp4`, mimeType: "video/mp4" };
    }
  };

  const { filename: outputName, mimeType } = getOutputConfig(recipe.format);
  const fallbackOutputName = `fallback_${sessionId}.webm`;
  const cleanupFiles = new Set<string>([inputName, outputName, fallbackOutputName]);

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  };

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal });

    ffmpeg.on("progress", handleProgress);

    const vf = buildVideoFilter(recipe, targetW, targetH);
    const audioTrim = buildAudioTrimFilter(recipe);
    const audioSpeed = buildAudioFilter(recipe);
    const afParts = [audioTrim, audioSpeed].filter(Boolean);
    const af = afParts.join(",");

    const args = ["-i", inputName];
    if (vf) args.push("-vf", vf);

    if (!recipe.keepAudio) {
      args.push("-an");
    } else if (af) {
      args.push("-af", af);
    }

    if (recipe.format === "webm") {
      args.push("-c:v", "libvpx-vp9", "-crf", String(recipe.quality));
      if (recipe.keepAudio) args.push("-c:a", "libopus");
    } else if (recipe.format === "mkv") {
      args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "medium");
      if (recipe.keepAudio) args.push("-c:a", "aac", "-b:a", "128k");
    } else {
      args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "medium", "-movflags", "+faststart");
      if (recipe.keepAudio) args.push("-c:a", "aac", "-b:a", "128k");
    }

    args.push(outputName);

    const exitCode = await ffmpeg.exec(args, undefined, { signal });

    if (exitCode !== 0) {
      const fallbackArgs = [
        "-i", inputName,
        ...(vf ? ["-vf", vf] : []),
        ...(recipe.keepAudio ? (af ? ["-af", af] : []) : ["-an"]),
        "-c:v", "libvpx-vp9",
        "-crf", String(recipe.quality),
        ...(recipe.keepAudio ? ["-c:a", "libopus"] : []),
        fallbackOutputName,
      ];

      const fallbackCode = await ffmpeg.exec(fallbackArgs, undefined, { signal });

      if (fallbackCode !== 0) throw new Error("Export failed");

      const data = await ffmpeg.readFile(fallbackOutputName, undefined, { signal });
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/webm" });

      onProgress(100);
      return {
        blobUrl: URL.createObjectURL(blob),
        size: blob.size,
        width: targetW,
        height: targetH,
        format: "webm",
      };
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal });
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: mimeType });

    onProgress(100);
    return {
      blobUrl: URL.createObjectURL(blob),
      size: blob.size,
      width: targetW,
      height: targetH,
      format: recipe.format as "mp4" | "webm" | "mkv",
    };
  } finally {
    ffmpeg.off("progress", handleProgress);
    for (const path of cleanupFiles) {
      try {
        await ffmpeg.deleteFile(path);
      } catch {}
    }
  }
}

/** Formats a byte count as a human-readable string (KB or MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}