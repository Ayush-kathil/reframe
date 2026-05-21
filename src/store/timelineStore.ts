import { create } from "zustand";

export type KeyframeProperty = "scale" | "opacity" | "positionX" | "positionY";

export type KeyframeNode = {
  time: number;
  value: number;
};

export type ClipKeyframes = Partial<Record<KeyframeProperty, KeyframeNode[]>>;

export type ClipAnimationValues = Record<KeyframeProperty, number>;

export const CLIP_ANIMATION_DEFAULTS: ClipAnimationValues = {
  scale: 1,
  opacity: 1,
  positionX: 0,
  positionY: 0,
};

export const EMPTY_KEYFRAMES: ClipKeyframes = {};

export type TimelineClip = {
  id: string;
  sourceUrl: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  label?: string;
  color?: string;
  keyframes: ClipKeyframes;
};

export type TransitionKind = "linear-fade" | "cross-dissolve" | "directional-slide";

export type TimelineTransition = {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  kind: TransitionKind;
  leftClipId: string;
  rightClipId: string;
};

export type TimelineTrack = {
  id: string;
  name: string;
  clips: TimelineClip[];
  transitions: TimelineTransition[];
  muted: boolean;
  locked: boolean;
};

type TrimEdge = "start" | "end";
type MediaTrimEdge = "in" | "out";

export type TextObject = {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  shadow: string | null;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  startTime: number;
  duration: number;
};

type TimelineState = {
  tracks: TimelineTrack[];
  textObjects: TextObject[];
  selectedTrackId: string | null;
  selectedClipId: string | null;
  selectedTextId: string | null;
  pixelsPerSecond: number;
  scrollOffsetX: number;
  viewportWidth: number;
  snapGuideTime: number | null;
  setTracks: (tracks: TimelineTrack[]) => void;
  resetTimeline: () => void;
  replaceProjectFromMedia: (sourceUrl: string, duration: number) => void;
  syncSourceDuration: (sourceUrl: string, duration: number) => void;
  addTrack: (name?: string) => void;
  addClip: (trackId: string, clip: Omit<TimelineClip, "id"> & Partial<Pick<TimelineClip, "id">>) => void;
  updateClip: (trackId: string, clipId: string, patch: Partial<Omit<TimelineClip, "id">>) => void;
  removeClip: (trackId: string, clipId: string) => void;
  moveClip: (trackId: string, clipId: string, startTime: number) => void;
  trimClip: (trackId: string, clipId: string, edge: TrimEdge, time: number, ripple: boolean) => void;
  trimClipMedia: (trackId: string, clipId: string, edge: MediaTrimEdge, timelineTime: number) => void;
  addTextObject: (obj: Omit<TextObject, "id">) => void;
  updateTextObject: (id: string, patch: Partial<TextObject>) => void;
  removeTextObject: (id: string) => void;
  setSelectedTextId: (id: string | null) => void;
  insertTransition: (
    trackId: string,
    leftClipId: string,
    rightClipId: string,
    kind: TransitionKind,
    duration?: number
  ) => void;
  removeTransition: (trackId: string, transitionId: string) => void;
  setSelectedTrackId: (trackId: string | null) => void;
  setSelectedClipId: (clipId: string | null) => void;
  setPixelsPerSecond: (pixelsPerSecond: number) => void;
  setScrollOffsetX: (scrollOffsetX: number) => void;
  setViewportWidth: (viewportWidth: number) => void;
  setSnapGuideTime: (snapGuideTime: number | null) => void;
  setClipKeyframe: (
    trackId: string,
    clipId: string,
    property: KeyframeProperty,
    time: number,
    value: number
  ) => void;
  removeClipKeyframe: (trackId: string, clipId: string, property: KeyframeProperty, time: number) => void;
  setKeyframeAtPlayhead: (
    trackId: string,
    clipId: string,
    property: KeyframeProperty,
    globalTime: number,
    value: number
  ) => void;
};

const MIN_CLIP_DURATION = 0.1;
const DEFAULT_ZOOM = 96;
const SNAP_THRESHOLD = 0.16;
const GRID_STEP = 0.5;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createTrack(name: string): TimelineTrack {
  return {
    id: createId("track"),
    name,
    clips: [],
    transitions: [],
    muted: false,
    locked: false,
  };
}

function createDefaultTracks(): TimelineTrack[] {
  return [createTrack("Video 1"), createTrack("Video 2"), createTrack("Audio")];
}

export function sortClips(clips: TimelineClip[]) {
  return [...clips].sort((left, right) => left.startTime - right.startTime || left.inPoint - right.inPoint);
}

export function getProjectDuration(tracks: TimelineTrack[]) {
  const longest = tracks.reduce((maxDuration, track) => {
    const trackDuration = track.clips.reduce((trackMax, clip) => Math.max(trackMax, clip.startTime + clip.duration), 0);
    return Math.max(maxDuration, trackDuration);
  }, 0);

  return Math.max(8, longest + 2);
}

function getTrackClipBounds(clips: TimelineClip[], clipId: string) {
  const sorted = sortClips(clips);
  const clipIndex = sorted.findIndex((clip) => clip.id === clipId);
  const clip = sorted[clipIndex];

  if (!clip) {
    return null;
  }

  const previousClip = clipIndex > 0 ? sorted[clipIndex - 1] : null;
  const nextClip = clipIndex < sorted.length - 1 ? sorted[clipIndex + 1] : null;

  return { clip, previousClip, nextClip, sorted, clipIndex };
}

export function buildSnapCandidates(clips: TimelineClip[], movingClipId: string, duration: number) {
  const candidates = new Set<number>();
  candidates.add(0);

  for (const clip of clips) {
    if (clip.id === movingClipId) continue;
    candidates.add(clip.startTime);
    candidates.add(clip.startTime + clip.duration);
    candidates.add(clip.startTime - duration);
    candidates.add(clip.startTime + clip.duration - duration);
  }

  for (let marker = 0; marker <= 3600; marker += GRID_STEP) {
    candidates.add(marker);
  }

  return [...candidates].sort((left, right) => left - right);
}

export function snapPosition(proposedStart: number, clips: TimelineClip[], movingClipId: string, duration: number) {
  let snappedStart = proposedStart;
  let shortestDistance = Infinity;
  let guideTime: number | null = null;

  for (const candidate of buildSnapCandidates(clips, movingClipId, duration)) {
    const distance = Math.abs(candidate - proposedStart);
    if (distance < shortestDistance && distance <= SNAP_THRESHOLD) {
      shortestDistance = distance;
      snappedStart = candidate;
      guideTime = candidate;
    }
  }

  return { snappedStart, guideTime };
}

function normalizeKeyframeTime(time: number, duration: number) {
  return Math.max(0, Math.min(duration, time));
}

function upsertKeyframeNodes(nodes: KeyframeNode[], time: number, value: number) {
  const normalizedTime = Number(time.toFixed(4));
  const existingIndex = nodes.findIndex((node) => Math.abs(node.time - normalizedTime) < 0.0001);
  if (existingIndex >= 0) {
    return nodes.map((node, index) => (index === existingIndex ? { time: normalizedTime, value } : node));
  }
  return [...nodes, { time: normalizedTime, value }].sort((left, right) => left.time - right.time);
}

function removeKeyframeNode(nodes: KeyframeNode[], time: number) {
  const normalizedTime = Number(time.toFixed(4));
  return nodes.filter((node) => Math.abs(node.time - normalizedTime) >= 0.0001);
}

function patchClipKeyframes(
  clip: TimelineClip,
  property: KeyframeProperty,
  updater: (nodes: KeyframeNode[]) => KeyframeNode[]
) {
  const current = clip.keyframes[property] || [];
  const nextNodes = updater(current);
  const nextKeyframes = { ...clip.keyframes };
  if (nextNodes.length === 0) {
    delete nextKeyframes[property];
  } else {
    nextKeyframes[property] = nextNodes;
  }
  return { ...clip, keyframes: nextKeyframes };
}

function updateTrack(track: TimelineTrack, updater: (clips: TimelineClip[]) => TimelineClip[]) {
  return {
    ...track,
    clips: updater(track.clips),
  };
}

function createSeedProject(sourceUrl: string, duration: number) {
  const clipDuration = Math.max(MIN_CLIP_DURATION, duration || 8);
  const clip: TimelineClip = {
    id: createId("clip"),
    sourceUrl,
    startTime: 0,
    duration: clipDuration,
    inPoint: 0,
    outPoint: clipDuration,
    label: "Main Cut",
    color: "#8b5cf6",
    keyframes: {
      scale: [
        { time: 0, value: 1 },
        { time: clipDuration, value: 1.12 },
      ],
      opacity: [
        { time: 0, value: 1 },
        { time: clipDuration, value: 0.85 },
      ],
    },
  };

  const tracks = createDefaultTracks();
  if (clipDuration > 2.4) {
    const half = clipDuration / 2;
    tracks[0] = {
      ...tracks[0]!,
      clips: [
        {
          ...clip,
          id: createId("clip"),
          duration: half,
          outPoint: half,
          label: "Intro",
        },
        {
          ...clip,
          id: createId("clip"),
          startTime: half,
          inPoint: half,
          duration: half,
          outPoint: clipDuration,
          label: "Outro",
          color: "#14b8a6",
        },
      ],
    };
  } else {
    tracks[0] = {
      ...tracks[0]!,
      clips: [clip],
    };
  }

  return {
    tracks,
    selectedTrackId: tracks[0]!.id,
    selectedClipId: tracks[0]!.clips[0]?.id ?? clip.id,
  };
}

function shiftSubsequentClips(
  sorted: TimelineClip[],
  clipId: string,
  pivotTime: number,
  delta: number,
  ripple: boolean
) {
  if (!ripple || delta === 0) {
    return sorted;
  }

  return sorted.map((entry) => {
    if (entry.id === clipId) return entry;
    if (entry.startTime < pivotTime) return entry;
    return { ...entry, startTime: Math.max(0, entry.startTime + delta) };
  });
}

export const useTimelineStore = create<TimelineState>((set) => ({
  tracks: createDefaultTracks(),
  textObjects: [],
  selectedTrackId: null,
  selectedClipId: null,
  selectedTextId: null,
  pixelsPerSecond: DEFAULT_ZOOM,
  scrollOffsetX: 0,
  viewportWidth: 0,
  snapGuideTime: null,
  setTracks: (tracks) => set({ tracks }),
  resetTimeline: () =>
    set({
      tracks: createDefaultTracks(),
      textObjects: [],
      selectedTrackId: null,
      selectedClipId: null,
      selectedTextId: null,
      pixelsPerSecond: DEFAULT_ZOOM,
      scrollOffsetX: 0,
      snapGuideTime: null,
    }),
  replaceProjectFromMedia: (sourceUrl, duration) => set(createSeedProject(sourceUrl, duration)),
  syncSourceDuration: (sourceUrl, duration) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        updateTrack(track, (clips) =>
          clips.map((clip) =>
            clip.sourceUrl === sourceUrl
              ? {
                  ...clip,
                  duration: Math.max(MIN_CLIP_DURATION, duration || clip.duration),
                  outPoint: clip.inPoint + Math.max(MIN_CLIP_DURATION, duration || clip.duration),
                }
              : clip
          )
        )
      ),
    })),
  addTrack: (name) =>
    set((state) => {
      const nextIndex = state.tracks.length + 1;
      const trackName = name || `Track ${nextIndex}`;

      return {
        tracks: [...state.tracks, createTrack(trackName)],
      };
    }),
  addClip: (trackId, clip) =>
    set((state) => {
      const clipId = clip.id || createId("clip");

      return {
        tracks: state.tracks.map((track) => {
          if (track.id !== trackId) return track;

          const newClip: TimelineClip = {
            id: clipId,
            sourceUrl: clip.sourceUrl,
            startTime: Math.max(0, clip.startTime),
            duration: Math.max(MIN_CLIP_DURATION, clip.duration),
            inPoint: Math.max(0, clip.inPoint),
            outPoint: Math.max(clip.inPoint + MIN_CLIP_DURATION, clip.outPoint),
            label: clip.label,
            color: clip.color,
            keyframes: clip.keyframes ? { ...clip.keyframes } : { ...EMPTY_KEYFRAMES },
          };

          return updateTrack(track, (clips) => sortClips([...clips, newClip]));
        }),
        selectedTrackId: trackId,
        selectedClipId: clipId,
      };
    }),
  updateClip: (trackId, clipId, patch) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id !== trackId
          ? track
          : updateTrack(track, (clips) =>
              clips.map((clip) => (clip.id === clipId ? { ...clip, ...patch } : clip))
            )
      ),
    })),
  removeClip: (trackId, clipId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id !== trackId
          ? track
          : updateTrack(track, (clips) => clips.filter((clip) => clip.id !== clipId))
      ),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    })),
  moveClip: (trackId, clipId, startTime) =>
    set((state) => {
      let guideTime: number | null = null;

      const tracks = state.tracks.map((track) => {
        if (track.id !== trackId || track.locked) return track;

        const clipBounds = getTrackClipBounds(track.clips, clipId);
        if (!clipBounds) return track;

        const { clip, previousClip, nextClip, sorted } = clipBounds;
        const minStart = previousClip ? previousClip.startTime + previousClip.duration : 0;
        const maxStart = nextClip ? nextClip.startTime - clip.duration : Number.POSITIVE_INFINITY;
        const constrainedStart = clamp(startTime, minStart, maxStart);
        const { snappedStart, guideTime: snapTime } = snapPosition(constrainedStart, sorted, clipId, clip.duration);
        guideTime = snapTime;
        const finalStart = clamp(snappedStart, minStart, maxStart);

        return updateTrack(track, (clips) =>
          sortClips(
            clips.map((currentClip) =>
              currentClip.id === clipId ? { ...currentClip, startTime: finalStart } : currentClip
            )
          )
        );
      });

      return {
        tracks,
        selectedTrackId: trackId,
        selectedClipId: clipId,
        snapGuideTime: guideTime,
      };
    }),
  trimClipMedia: (trackId, clipId, edge, timelineTime) =>
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId || track.locked) return track;

        return updateTrack(track, (clips) =>
          clips.map((clip) => {
            if (clip.id !== clipId) return clip;

            if (edge === "in") {
              const minStart = 0;
              const maxStart = clip.startTime + clip.duration - MIN_CLIP_DURATION;
              const nextStart = clamp(timelineTime, minStart, maxStart);
              const delta = nextStart - clip.startTime;
              const nextInPoint = clip.inPoint + delta;
              const nextDuration = Math.max(MIN_CLIP_DURATION, clip.outPoint - nextInPoint);
              return {
                ...clip,
                startTime: nextStart,
                inPoint: nextInPoint,
                duration: nextDuration,
              };
            }

            const nextEnd = Math.max(clip.startTime + MIN_CLIP_DURATION, timelineTime);
            const nextDuration = Math.max(MIN_CLIP_DURATION, nextEnd - clip.startTime);
            const nextOutPoint = clip.inPoint + nextDuration;
            return {
              ...clip,
              duration: nextDuration,
              outPoint: nextOutPoint,
            };
          })
        );
      }),
      selectedTrackId: trackId,
      selectedClipId: clipId,
    })),
  addTextObject: (obj) =>
    set((state) => {
      const id = createId("text");
      return {
        textObjects: [...state.textObjects, { ...obj, id }],
        selectedTextId: id,
      };
    }),
  updateTextObject: (id, patch) =>
    set((state) => ({
      textObjects: state.textObjects.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  removeTextObject: (id) =>
    set((state) => ({
      textObjects: state.textObjects.filter((t) => t.id !== id),
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
    })),
  setSelectedTextId: (selectedTextId) => set({ selectedTextId }),
  insertTransition: (trackId, leftClipId, rightClipId, kind, duration = 0.6) =>
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track;

        const leftClip = track.clips.find((clip) => clip.id === leftClipId);
        const rightClip = track.clips.find((clip) => clip.id === rightClipId);
        if (!leftClip || !rightClip) return track;

        const junctionTime = leftClip.startTime + leftClip.duration;
        const transition: TimelineTransition = {
          id: createId("transition"),
          trackId,
          startTime: junctionTime,
          duration: Math.max(0.2, duration),
          kind,
          leftClipId,
          rightClipId,
        };

        return {
          ...track,
          transitions: [
            ...track.transitions.filter(
              (entry) =>
                !(entry.leftClipId === leftClipId && entry.rightClipId === rightClipId)
            ),
            transition,
          ],
        };
      }),
    })),
  removeTransition: (trackId, transitionId) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id !== trackId
          ? track
          : { ...track, transitions: track.transitions.filter((entry) => entry.id !== transitionId) }
      ),
    })),
  trimClip: (trackId, clipId, edge, time, ripple) =>
    set((state) => {
      const nextTracks = state.tracks.map((track) => {
        if (track.id !== trackId || track.locked) return track;

        const clipBounds = getTrackClipBounds(track.clips, clipId);
        if (!clipBounds) return track;

        const { clip, sorted } = clipBounds;
        const clipIndex = sorted.findIndex((entry) => entry.id === clipId);
        const previousClip = clipIndex > 0 ? sorted[clipIndex - 1] : null;
        const targetClip = sorted[clipIndex]!;
        const oldStart = clip.startTime;
        const oldEnd = clip.startTime + clip.duration;

        if (edge === "start") {
          const minStart = previousClip ? previousClip.startTime + previousClip.duration : 0;
          const maxStart = oldEnd - MIN_CLIP_DURATION;
          const snappedStart = clamp(time, minStart, maxStart);
          const delta = snappedStart - oldStart;
          const nextDuration = Math.max(MIN_CLIP_DURATION, oldEnd - snappedStart);
          const newInPoint = Math.max(0, clip.inPoint + delta);
          const updatedClip: TimelineClip = {
            ...targetClip,
            startTime: snappedStart,
            duration: nextDuration,
            inPoint: newInPoint,
            outPoint: newInPoint + nextDuration,
          };

          const shifted = sorted.map((entry) => (entry.id === clipId ? updatedClip : entry));
          return updateTrack(track, () => sortClips(shiftSubsequentClips(shifted, clipId, oldStart, delta, ripple)));
        }

        const minEnd = oldStart + MIN_CLIP_DURATION;
        const snappedEnd = Math.max(minEnd, time);
        const delta = snappedEnd - oldEnd;
        const nextDuration = Math.max(MIN_CLIP_DURATION, snappedEnd - oldStart);
        const updatedClip: TimelineClip = {
          ...targetClip,
          duration: nextDuration,
          outPoint: targetClip.inPoint + nextDuration,
        };

        const shifted = sorted.map((entry) => (entry.id === clipId ? updatedClip : entry));
        return updateTrack(track, () => sortClips(shiftSubsequentClips(shifted, clipId, oldEnd, delta, ripple)));
      });

      return {
        tracks: nextTracks,
        selectedTrackId: trackId,
        selectedClipId: clipId,
        snapGuideTime: null,
      };
    }),
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setPixelsPerSecond: (pixelsPerSecond) => set({ pixelsPerSecond: clamp(pixelsPerSecond, 48, 220) }),
  setScrollOffsetX: (scrollOffsetX) => set({ scrollOffsetX: Math.max(0, scrollOffsetX) }),
  setViewportWidth: (viewportWidth) => set({ viewportWidth: Math.max(0, viewportWidth) }),
  setSnapGuideTime: (snapGuideTime) => set({ snapGuideTime }),
  setClipKeyframe: (trackId, clipId, property, time, value) =>
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track;
        return updateTrack(track, (clips) =>
          clips.map((clip) => {
            if (clip.id !== clipId) return clip;
            const localTime = normalizeKeyframeTime(time, clip.duration);
            return patchClipKeyframes(clip, property, (nodes) => upsertKeyframeNodes(nodes, localTime, value));
          })
        );
      }),
    })),
  removeClipKeyframe: (trackId, clipId, property, time) =>
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track;
        return updateTrack(track, (clips) =>
          clips.map((clip) => {
            if (clip.id !== clipId) return clip;
            const localTime = normalizeKeyframeTime(time, clip.duration);
            return patchClipKeyframes(clip, property, (nodes) => removeKeyframeNode(nodes, localTime));
          })
        );
      }),
    })),
  setKeyframeAtPlayhead: (trackId, clipId, property, globalTime, value) =>
    set((state) => {
      const track = state.tracks.find((entry) => entry.id === trackId);
      const clip = track?.clips.find((entry) => entry.id === clipId);
      if (!track || !clip) return state;
      const localTime = normalizeKeyframeTime(globalTime - clip.startTime, clip.duration);
      return {
        tracks: state.tracks.map((entry) => {
          if (entry.id !== trackId) return entry;
          return updateTrack(entry, (clips) =>
            clips.map((entryClip) => {
              if (entryClip.id !== clipId) return entryClip;
              return patchClipKeyframes(entryClip, property, (nodes) =>
                upsertKeyframeNodes(nodes, localTime, value)
              );
            })
          );
        }),
      };
    }),
}));

export function getTimelineProjectDuration() {
  return getProjectDuration(useTimelineStore.getState().tracks);
}
