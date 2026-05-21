const fs = require('fs');

// StudioShell.tsx
let studio = fs.readFileSync('src/components/StudioShell.tsx', 'utf8');
studio = studio.replace('<ExportSettings recipe={recipe} onChange={updateRecipe} />', '<ExportSettings recipe={recipe} duration={duration} onChange={updateRecipe} />');
fs.writeFileSync('src/components/StudioShell.tsx', studio);

// focusTracker.ts
let focus = fs.readFileSync('src/lib/tracking/focusTracker.ts', 'utf8');
focus = focus.replace('time <= sorted[0].time', 'time <= sorted[0]!.time');
focus = focus.replace('return { ...sorted[0], time }', 'return { ...sorted[0]!, time }');
focus = focus.replace('last = sorted[sorted.length - 1];', 'last = sorted[sorted.length - 1]!;');
focus = focus.replace('return { ...last, time }', 'return { ...last, time }'); // Not needed if last is defined
focus = focus.replace('const current = sorted[i];', 'const current = sorted[i]!;');
focus = focus.replace('const next = sorted[i + 1];', 'const next = sorted[i + 1]!;');
fs.writeFileSync('src/lib/tracking/focusTracker.ts', focus);

// timelineStore.ts
let timeline = fs.readFileSync('src/store/timelineStore.ts', 'utf8');
timeline = timeline.replace('tracks[1] = {\\n      ...tracks[1],\\n      clips:', 'tracks[1] = {\\n      ...tracks[1]!,\\n      clips:');
timeline = timeline.replace('const t0 = tracks[0];', 'const t0 = tracks[0]!;');
timeline = timeline.replace('const t1 = tracks[1];', 'const t1 = tracks[1]!;');
timeline = timeline.replace('return { ...c, startTime: c.startTime - adjust };', 'return { ...c, id: c.id ?? \\"\\", sourceUrl: c.sourceUrl ?? \\"\\", startTime: c.startTime - adjust };');
timeline = timeline.replace('return { ...c, startTime: c.startTime! - adjust };', 'return { ...c, id: c.id ?? \\"\\", sourceUrl: c.sourceUrl ?? \\"\\", startTime: c.startTime! - adjust };');
timeline = timeline.replace('targetClip = track.clips.find((c) => c.id === clipId);\\n      targetClip.outPoint = newTime;', 'targetClip = track.clips.find((c) => c.id === clipId);\\n      if (targetClip) targetClip.outPoint = newTime;');
fs.writeFileSync('src/store/timelineStore.ts', timeline);

console.log('Fixed');
