export type TrackingSample = {
  time: number;
  centerX: number;
  centerY: number;
};

const GRID_COLS = 12;
const GRID_ROWS = 7;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function measureFocusCenter(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  const sampleWidth = 192;
  const sampleHeight = Math.max(1, Math.round((height / width) * sampleWidth));
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { centerX: 0.5, centerY: 0.5 };
  }

  ctx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  const image = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const cellWidth = Math.floor(sampleWidth / GRID_COLS);
  const cellHeight = Math.floor(sampleHeight / GRID_ROWS);

  let bestScore = -Infinity;
  let bestX = 0.5;
  let bestY = 0.5;

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      let luminance = 0;
      let contrast = 0;
      let count = 0;

      for (let y = row * cellHeight; y < (row + 1) * cellHeight; y += 2) {
        for (let x = col * cellWidth; x < (col + 1) * cellWidth; x += 2) {
          const index = (y * sampleWidth + x) * 4;
          const red = image.data[index];
          const green = image.data[index + 1];
          const blue = image.data[index + 2];
          const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
          luminance += luma;
          contrast += Math.abs(red - green) + Math.abs(green - blue);
          count += 1;
        }
      }

      const avgLuma = luminance / Math.max(1, count);
      const avgContrast = contrast / Math.max(1, count);
      const centerBias = 1 - Math.hypot(col / GRID_COLS - 0.5, row / GRID_ROWS - 0.5);
      const score = avgLuma * 0.62 + avgContrast * 0.28 + centerBias * 40;

      if (score > bestScore) {
        bestScore = score;
        bestX = (col + 0.5) / GRID_COLS;
        bestY = (row + 0.5) / GRID_ROWS;
      }
    }
  }

  return { centerX: bestX, centerY: bestY };
}

export function interpolateTracking(samples: TrackingSample[], time: number) {
  if (samples.length === 0) {
    return { centerX: 0.5, centerY: 0.5 };
  }

  if (time <= samples[0].time) {
    return { centerX: samples[0].centerX, centerY: samples[0].centerY };
  }

  const last = samples[samples.length - 1];
  if (time >= last.time) {
    return { centerX: last.centerX, centerY: last.centerY };
  }

  for (let index = 0; index < samples.length - 1; index += 1) {
    const current = samples[index];
    const next = samples[index + 1];
    if (time >= current.time && time <= next.time) {
      const span = next.time - current.time;
      const amount = span <= 0 ? 0 : (time - current.time) / span;
      return {
        centerX: current.centerX + (next.centerX - current.centerX) * amount,
        centerY: current.centerY + (next.centerY - current.centerY) * amount,
      };
    }
  }

  return { centerX: 0.5, centerY: 0.5 };
}

export function buildMockTrackingPath(duration: number, sampleCount = 48): TrackingSample[] {
  const safeDuration = Math.max(1, duration);
  const count = Math.max(12, sampleCount);
  return Array.from({ length: count }, (_, index) => {
    const time = (index / (count - 1)) * safeDuration;
    const wave = Math.sin(time * 0.9) * 0.12 + Math.sin(time * 0.23 + 1.2) * 0.08;
    return {
      time,
      centerX: clamp(0.5 + wave, 0.22, 0.78),
      centerY: clamp(0.52 + Math.cos(time * 0.45) * 0.05, 0.35, 0.65),
    };
  });
}

export async function buildTrackingPathFromVideo(
  video: HTMLVideoElement,
  duration: number,
  sampleCount = 40
): Promise<TrackingSample[]> {
  const safeDuration = Math.max(0.5, duration || video.duration || 8);
  const count = Math.max(12, sampleCount);
  const samples: TrackingSample[] = [];
  const previousTime = video.currentTime;

  for (let index = 0; index < count; index += 1) {
    const time = (index / (count - 1)) * safeDuration;
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        const focus = measureFocusCenter(video, video.videoWidth || 1920, video.videoHeight || 1080);
        samples.push({ time, centerX: focus.centerX, centerY: focus.centerY });
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = Math.min(safeDuration - 0.04, time);
    });
  }

  video.currentTime = previousTime;
  return samples.length > 0 ? samples : buildMockTrackingPath(safeDuration, count);
}
