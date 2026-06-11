// engine.js — generates questions for every module and grades the answers.
//
// A Question owns its exact audio (root, voicing, melody), so replay is always
// identical and any answer option can be auditioned from the same root for
// comparison after a miss.

import * as Audio from './audio.js';
import {
  INTERVALS, CHORDS, SCALES, DEGREES, NUMERALS, CADENCES,
  randInt, choice, weightedChoice,
} from './theory.js';
import { moduleById } from './curriculum.js';
import { state, itemWeight } from './state.js';

let lastItemKey = null;

// Weakness-weighted pick over candidate skills; damp the one just asked.
function pickWeighted(cands) {
  const weights = cands.map(c =>
    (c.itemKey === lastItemKey && cands.length > 2 ? 0.25 : 1) * itemWeight(c.itemKey));
  const picked = weightedChoice(cands, weights);
  lastItemKey = picked.itemKey;
  return picked;
}

function playFresh(events) {
  Audio.stopAll();
  return Audio.playEvents(events);
}

export function generate(moduleId, levelIdx) {
  const mod = moduleById(moduleId);
  const level = mod.levels[levelIdx];
  switch (moduleId) {
    case 'pitch': return genPitch(mod, level, levelIdx);
    case 'intervals': return genInterval(mod, level, levelIdx);
    case 'chords': return genChord(mod, level, levelIdx);
    case 'scales': return genScale(mod, level, levelIdx);
    case 'degrees': return genDegree(mod, level, levelIdx);
    case 'progressions': return genProgression(mod, level, levelIdx);
    case 'melodies': return genMelody(mod, level, levelIdx);
  }
}

// ── Pitch: higher / lower / same ─────────────────────────────────────────────

function genPitch(mod, level, levelIdx) {
  const ids = level.allowSame ? ['up', 'down', 'same'] : ['up', 'down'];
  const picked = pickWeighted(ids.map(id => ({ id, itemKey: `pi:${id}` })));
  const gap = picked.id === 'same' ? 0 : randInt(level.gap[0], level.gap[1]);
  let lo = 48, hi = 76;
  if (picked.id === 'up') hi -= gap;
  if (picked.id === 'down') lo += gap;
  const a = randInt(lo, hi);
  const b = picked.id === 'up' ? a + gap : picked.id === 'down' ? a - gap : a;
  const events = [
    { midi: a, at: 0, dur: 0.7 },
    { midi: b, at: 0.88, dur: 0.7 },
  ];
  const labels = { up: 'Higher', down: 'Lower', same: 'Same' };
  return {
    moduleId: 'pitch', levelIdx, kind: 'choice', prompt: mod.prompt,
    options: ids.map(id => ({ id, label: labels[id] })),
    answerId: picked.id,
    play: () => playFresh(events),
    playOption: null,
    grade(answeredId) {
      const correct = answeredId === this.answerId;
      return {
        correct,
        itemResults: [{ key: `pi:${this.answerId}`, correct }],
        confusion: null,
      };
    },
  };
}

// ── Intervals ────────────────────────────────────────────────────────────────

function genInterval(mod, level, levelIdx) {
  const cands = [];
  for (const id of level.items) {
    for (const dir of level.dirs) {
      cands.push({ id, dir, itemKey: `iv:${id}:${dir}` });
    }
  }
  const picked = pickWeighted(cands);
  const semis = INTERVALS[picked.id].semis;

  // Keep both notes inside C3–C6 (48–84).
  let rootLo = 48, rootHi = 72;
  if (picked.dir === 'd') rootLo = Math.max(48, 48 + semis);
  else rootHi = Math.min(72, 84 - semis);
  const root = randInt(rootLo, Math.max(rootLo, rootHi));
  const events = Audio.intervalEvents(root, semis, picked.dir);

  const optionIds = [...new Set(level.items)];
  const song = INTERVALS[picked.id].songs?.[picked.dir === 'd' ? 'desc' : 'asc'];
  const dirWord = { a: 'ascending', d: 'descending', h: 'harmonic' }[picked.dir];

  return {
    moduleId: 'intervals', levelIdx, kind: 'choice', prompt: mod.prompt,
    options: optionIds.map(id => ({ id, label: INTERVALS[id].name, sub: INTERVALS[id].short })),
    answerId: picked.id,
    mnemonic: song && picked.dir !== 'h'
      ? `${INTERVALS[picked.id].name} ${dirWord} · think “${song}”`
      : null,
    play: () => playFresh(events),
    playOption: id => playFresh(Audio.intervalEvents(root, INTERVALS[id].semis, picked.dir)),
    grade(answeredId) {
      const correct = answeredId === this.answerId;
      return {
        correct,
        itemResults: [{ key: picked.itemKey, correct }],
        confusion: { correctId: this.answerId, answeredId },
      };
    },
  };
}

// ── Chords ───────────────────────────────────────────────────────────────────

function genChord(mod, level, levelIdx) {
  const picked = pickWeighted(level.items.map(id => ({ id, itemKey: `ch:${id}` })));
  const semis = CHORDS[picked.id].semis;
  const maxOffset = Math.max(...semis);
  // Voicing centred around middle C; top note capped near A5.
  const root = randInt(55, Math.max(55, Math.min(67, 81 - maxOffset)));
  const style = state.settings.chordStyle;

  return {
    moduleId: 'chords', levelIdx, kind: 'choice', prompt: mod.prompt,
    options: level.items.map(id => ({ id, label: CHORDS[id].name, sub: CHORDS[id].short })),
    answerId: picked.id,
    play: () => playFresh(Audio.chordEvents(root, semis, style)),
    playOption: id => playFresh(Audio.chordEvents(root, CHORDS[id].semis, style)),
    grade(answeredId) {
      const correct = answeredId === this.answerId;
      return {
        correct,
        itemResults: [{ key: picked.itemKey, correct }],
        confusion: { correctId: this.answerId, answeredId },
      };
    },
  };
}

// ── Scales ───────────────────────────────────────────────────────────────────

function genScale(mod, level, levelIdx) {
  const picked = pickWeighted(level.items.map(id => ({ id, itemKey: `sc:${id}` })));
  const root = randInt(53, 67);

  return {
    moduleId: 'scales', levelIdx, kind: 'choice', prompt: mod.prompt,
    options: level.items.map(id => ({ id, label: SCALES[id].name, sub: SCALES[id].sub })),
    answerId: picked.id,
    play: () => playFresh(Audio.scaleEvents(root, SCALES[picked.id].semis)),
    playOption: id => playFresh(Audio.scaleEvents(root, SCALES[id].semis)),
    grade(answeredId) {
      const correct = answeredId === this.answerId;
      return {
        correct,
        itemResults: [{ key: picked.itemKey, correct }],
        confusion: { correctId: this.answerId, answeredId },
      };
    },
  };
}

// ── Functional helpers: cadence + voiced numerals ────────────────────────────

// Close-position triad voiced near `center`, plus a bass root note.
function voiceNumeral(keyRoot, numeralId, center = 64) {
  const num = NUMERALS[numeralId];
  const chordRoot = keyRoot + num.root;
  const base = CHORDS[num.quality].semis; // [0,3/4,7]
  const inversions = [
    [base[0], base[1], base[2]],
    [base[1], base[2], base[0] + 12],
    [base[2], base[0] + 12, base[1] + 12],
  ];
  let best = null, bestDist = Infinity;
  for (const inv of inversions) {
    for (const oct of [-12, 0, 12]) {
      const notes = inv.map(s => chordRoot + s + oct);
      const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
      const d = Math.abs(avg - center);
      if (d < bestDist) { bestDist = d; best = notes; }
    }
  }
  let bass = chordRoot;
  while (bass > 52) bass -= 12;
  while (bass < 41) bass += 12;
  return [bass, ...best];
}

function cadenceFor(keyRoot, mode) {
  return Audio.cadenceEvents(
    CADENCES[mode].map(n => ({ root: 0, semis: voiceNumeral(keyRoot, n) }))
  );
}

// ── Scale degrees ────────────────────────────────────────────────────────────

function genDegree(mod, level, levelIdx) {
  const picked = pickWeighted(level.items.map(id => ({ id, itemKey: `dg:${level.mode}:${id}` })));
  const keyRoot = randInt(53, 64);
  const octave = level.wide ? choice([-12, 0, 12]) : choice([0, 12]);
  const noteMidi = keyRoot + DEGREES[picked.id].semis + octave;

  const cadence = cadenceFor(keyRoot, level.mode);
  const noteAt = Audio.eventsDuration(cadence) + 0.55;
  const events = [...cadence, { midi: noteMidi, at: noteAt, dur: 1.0 }];

  const labelOf = id => state.settings.degreeLabels === 'number'
    ? DEGREES[id].number : DEGREES[id].solfege;
  const subOf = id => state.settings.degreeLabels === 'number'
    ? DEGREES[id].solfege : DEGREES[id].number;

  return {
    moduleId: 'degrees', levelIdx, kind: 'choice', prompt: mod.prompt,
    options: level.items.map(id => ({ id, label: labelOf(id), sub: subOf(id) })),
    answerId: picked.id,
    play: () => playFresh(events),
    // Compare a degree in the same register as the question note.
    playOption: id => {
      const candidates = [-12, 0, 12].map(o => keyRoot + DEGREES[id].semis + o);
      const m = candidates.reduce((a, b) =>
        Math.abs(b - noteMidi) < Math.abs(a - noteMidi) ? b : a);
      return playFresh([{ midi: m, at: 0, dur: 1.0 }]);
    },
    grade(answeredId) {
      const correct = answeredId === this.answerId;
      return {
        correct,
        itemResults: [{ key: picked.itemKey, correct }],
        confusion: { correctId: this.answerId, answeredId },
      };
    },
  };
}

// ── Progressions ─────────────────────────────────────────────────────────────

function genProgression(mod, level, levelIdx) {
  const tonic = level.mode === 'major' ? 'I' : 'i';
  const enders = level.pool.filter(n => ['I', 'i', 'V', 'vi'].includes(n));

  const seq = [];
  seq.push(level.startTonic ? tonic : choice(level.pool));
  for (let i = 1; i < level.length; i++) {
    let next;
    do { next = choice(level.pool); } while (next === seq[i - 1]);
    seq.push(next);
  }
  // Real progressions tend to land somewhere stable.
  if (enders.length && Math.random() < 0.7 && !enders.includes(seq[seq.length - 1])) {
    let last;
    do { last = choice(enders); } while (last === seq[seq.length - 2]);
    seq[seq.length - 1] = last;
  }

  const keyRoot = randInt(50, 59);
  const cadence = cadenceFor(keyRoot, level.mode);
  let at = Audio.eventsDuration(cadence) + 0.8;
  const progEvents = [];
  for (const n of seq) {
    progEvents.push({ midis: voiceNumeral(keyRoot, n), at, dur: 0.85, vel: 0.6 });
    at += 0.95;
  }
  const events = [...cadence, ...progEvents];
  const given = seq.map((_, i) => i === 0 && level.startTonic);

  return {
    moduleId: 'progressions', levelIdx, kind: 'sequence', prompt: mod.prompt,
    options: level.pool.map(id => ({ id, label: NUMERALS[id].name })),
    answerSeq: seq,
    given,
    slots: level.length,
    play: () => playFresh(events),
    playProgressionOnly: () => playFresh(progEvents.map(e => ({ ...e, at: e.at - progEvents[0].at }))),
    playOption: null,
    grade(userSeq) { // user fills every slot; given slots are just shown as hints
      const itemResults = [];
      let allCorrect = true;
      for (let i = 0; i < seq.length; i++) {
        const ok = userSeq[i] === seq[i];
        if (!ok) allCorrect = false;
        if (!given[i]) itemResults.push({ key: `pg:${level.mode}:${seq[i]}`, correct: ok });
      }
      return { correct: allCorrect, itemResults, confusion: null };
    },
  };
}

// ── Melodies ─────────────────────────────────────────────────────────────────

function genMelody(mod, level, levelIdx) {
  const keyRoot = randInt(55, 64);
  // Allowed scale tones: exactly the level's stated degrees, plus the upper Do
  // only when the level opts in — never notes beyond what the level promises
  // (and never beyond the rendered keyboard).
  const allowed = level.degrees.map(d => keyRoot + DEGREES[d].semis);
  if (level.upperDo) allowed.push(keyRoot + 12);
  allowed.sort((a, b) => a - b);
  const top = allowed[allowed.length - 1];

  const startPool = level.length <= 4
    ? [keyRoot]
    : [keyRoot, keyRoot + 4, keyRoot + 7].filter(m => allowed.includes(m));
  let idx = allowed.indexOf(startPool.length ? choice(startPool) : keyRoot);
  if (idx < 0) idx = 0;

  const stepWeights = level.leapy
    ? [[-4, 1], [-3, 1.5], [-2, 2], [-1, 3], [1, 3], [2, 2], [3, 1.5], [4, 1]]
    : [[-2, 1], [-1, 3.5], [1, 3.5], [2, 1]];

  const midis = [allowed[idx]];
  for (let i = 1; i < level.length; i++) {
    const moves = stepWeights.filter(([s]) => idx + s >= 0 && idx + s < allowed.length);
    const [step] = weightedChoice(moves, moves.map(([, w]) => w));
    idx += step;
    let m = allowed[idx];
    if (level.chromatic && Math.random() < level.chromatic && i < level.length - 1) {
      const alt = m + choice([-1, 1]);
      if (alt > keyRoot - 1 && alt < top + 1 && !allowed.includes(alt)) m = alt;
    }
    midis.push(m);
  }

  const tempo = state.settings.melodyTempo;
  const cadence = cadenceFor(keyRoot, 'major');
  const melodyStart = Audio.eventsDuration(cadence) + 0.7;
  const events = [...cadence, ...Audio.shiftEvents(Audio.melodyEvents(midis, tempo), melodyStart)];

  return {
    moduleId: 'melodies', levelIdx, kind: 'melody', prompt: mod.prompt,
    targetMidis: midis,
    firstGiven: !!level.firstGiven,   // first note shown as a hint; user still plays it
    tonicMidi: keyRoot,
    keyRange: [keyRoot - 1, top + 1], // every possible answer fits on the keyboard
    play: () => playFresh(events),
    playMelodyOnly: () => playFresh(Audio.melodyEvents(midis, tempo)),
    playOption: null,
    grade(userMidis) {
      let allCorrect = true;
      for (let i = 0; i < midis.length; i++) {
        if (userMidis[i] !== midis[i]) allCorrect = false;
      }
      return {
        correct: allCorrect,
        itemResults: [{ key: `ml:L${levelIdx}`, correct: allCorrect }],
        confusion: null,
      };
    },
  };
}
