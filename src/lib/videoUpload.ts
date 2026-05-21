export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".webm"] as const;

export function isValidVideoFile(file: File) {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_TYPES)[number])) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return ACCEPTED_VIDEO_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export function pickVideoFile(files: FileList | File[] | null | undefined) {
  if (!files || files.length === 0) {
    return null;
  }

  const list = Array.from(files);
  return list.find((file) => isValidVideoFile(file)) ?? null;
}
