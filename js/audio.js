// audio.js — Web Audio synthesis engine.
// A warm, piano-ish percussive tone built from layered oscillators, plus
// sequencing helpers for intervals, chords, scales, cadences and melodies.

import { midiToFreq } from './theory.js';

let ctx = null;
let master = null;       // master gain (volume setting)
let compressor = null;   // protects against clipping on dense chords
let bus = null;          // per-play gain bus, swapped on stopAll()
let resumePromise = null;
let volume = 0.9;

// Must be called synchronously inside a user-gesture handler (iOS requirement).
export function unlock() {
  if (!ctx || ctx.state === 'closed') {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = volume;
    compressor.connect(master);
    master.connect(ctx.destination);
    bus = ctx.createGain();
    bus.connect(compressor);
  }
  if (ctx.state === 'suspended') {
    resumePromise = ctx.resume().then(() => { resumePromise = null; });
  }
}

export function setVolume(v) {
  volume = v;
  if (master) master.gain.value = v;
}

async function ensureRunning() {
  if (!ctx) unlock();
  if (resumePromise) await resumePromise;
  return ctx;
}

// Fade out anything currently scheduled and start a fresh bus.
export function stopAll() {
  if (!ctx || !bus) return;
  const old = bus;
  const t = ctx.currentTime;
  old.gain.setValueAtTime(old.gain.value, t);
  old.gain.linearRampToValueAtTime(0, t + 0.04);
  setTimeout(() => old.disconnect(), 120);
  bus = ctx.createGain();
  bus.connect(compressor);
}

// One percussive piano-ish note: triangle body + sine fundamental + soft octave,
// through a key-tracked lowpass, with an exponential decay envelope.
function tone(midi, when, dur, vel = 1) {
  const f = midiToFreq(midi);
  const out = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(4200, 700 + f * 2.2), when);
  filter.Q.value = 0.5;
  filter.connect(out);
  out.connect(bus);

  const layers = [
    { type: 'triangle', freq: f,     gain: 0.50 },
    { type: 'sine',     freq: f,     gain: 0.30 },
    { type: 'sine',     freq: f * 2, gain: 0.08 },
  ];
  for (const l of layers) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = l.type;
    osc.frequency.setValueAtTime(l.freq, when);
    g.gain.value = l.gain;
    osc.connect(g);
    g.connect(filter);
    osc.start(when);
    osc.stop(when + dur + 0.3);
  }

  const peak = 0.5 * vel;
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(peak, when + 0.01);
  out.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.18), when + dur);
  out.gain.exponentialRampToValueAtTime(0.0008, when + dur + 0.25);
}

// events: [{ midi | midis, at, dur, vel }] with `at` in seconds from start.
// Resolves when the last event has finished sounding.
export async function playEvents(events) {
  await ensureRunning();
  const t0 = ctx.currentTime + 0.06;
  let end = 0;
  for (const e of events) {
    const midis = e.midis || [e.midi];
    for (const m of midis) tone(m, t0 + e.at, e.dur, e.vel ?? 1);
    end = Math.max(end, e.at + e.dur);
  }
  return new Promise(res => setTimeout(res, (end + 0.15) * 1000));
}

export function playNote(midi, dur = 0.8, vel = 1) {
  return playEvents([{ midi, at: 0, dur, vel }]);
}

// dir: 'a' ascending, 'd' descending, 'h' harmonic. rootMidi is the first note.
export function intervalEvents(rootMidi, semis, dir, opts = {}) {
  const dur = opts.noteDur ?? 0.7;
  const gap = 0.18;
  const other = dir === 'd' ? rootMidi - semis : rootMidi + semis;
  if (dir === 'h') {
    return [{ midis: [rootMidi, other], at: 0, dur: dur + 0.35 }];
  }
  return [
    { midi: rootMidi, at: 0, dur },
    { midi: other, at: dur + gap, dur },
  ];
}

// style: 'block' | 'block+arp' | 'arp'
export function chordEvents(rootMidi, semis, style = 'block+arp') {
  const midis = semis.map(s => rootMidi + s);
  const vel = Math.min(1, 2.6 / midis.length);
  const ev = [];
  let at = 0;
  if (style !== 'arp') {
    ev.push({ midis, at: 0, dur: 1.1, vel });
    at = 1.35;
  }
  if (style !== 'block') {
    midis.forEach((m, i) => ev.push({ midi: m, at: at + i * 0.22, dur: 0.6, vel: 0.85 }));
  }
  return ev;
}

export function scaleEvents(rootMidi, semis) {
  return semis.map((s, i) => ({ midi: rootMidi + s, at: i * 0.34, dur: 0.32 }));
}

export function melodyEvents(midis, tempo = 0.5) {
  return midis.map((m, i) => ({ midi: m, at: i * tempo, dur: tempo * 0.92 }));
}

// Block-chord cadence to establish a key. chords: [{root, semis}], short and snappy.
export function cadenceEvents(chords) {
  const ev = [];
  chords.forEach((c, i) => {
    const last = i === chords.length - 1;
    ev.push({
      midis: c.semis.map(s => c.root + s),
      at: i * 0.62,
      dur: last ? 0.95 : 0.58,
      vel: 0.55,
    });
  });
  return ev;
}

// Shift a list of events to start `offset` seconds later.
export function shiftEvents(events, offset) {
  return events.map(e => ({ ...e, at: e.at + offset }));
}

export function eventsDuration(events) {
  return events.reduce((m, e) => Math.max(m, e.at + e.dur), 0);
}
