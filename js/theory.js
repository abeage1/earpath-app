// theory.js — music theory data: intervals, chords, scales, degrees, numerals

export const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const midiName = m => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
export const pitchClassName = pc => NOTE_NAMES[((pc % 12) + 12) % 12];

// ── Intervals ────────────────────────────────────────────────────────────────
// Reference songs are mnemonics: a recognizable melody that opens with the interval.
export const INTERVALS = {
  m2:  { semis: 1,  name: 'Minor 2nd',    short: 'm2',
         songs: { asc: 'Jaws theme', desc: 'Für Elise (opening)' } },
  M2:  { semis: 2,  name: 'Major 2nd',    short: 'M2',
         songs: { asc: 'Happy Birthday', desc: 'Mary Had a Little Lamb' } },
  m3:  { semis: 3,  name: 'Minor 3rd',    short: 'm3',
         songs: { asc: 'Greensleeves', desc: 'Hey Jude' } },
  M3:  { semis: 4,  name: 'Major 3rd',    short: 'M3',
         songs: { asc: 'Oh When the Saints', desc: 'Swing Low, Sweet Chariot' } },
  P4:  { semis: 5,  name: 'Perfect 4th',  short: 'P4',
         songs: { asc: 'Here Comes the Bride', desc: 'Eine kleine Nachtmusik' } },
  TT:  { semis: 6,  name: 'Tritone',      short: 'TT',
         songs: { asc: 'The Simpsons theme', desc: 'Even Flow (Pearl Jam)' } },
  P5:  { semis: 7,  name: 'Perfect 5th',  short: 'P5',
         songs: { asc: 'Star Wars theme', desc: 'The Flintstones theme' } },
  m6:  { semis: 8,  name: 'Minor 6th',    short: 'm6',
         songs: { asc: 'The Entertainer (3rd–4th notes)', desc: 'Love Story theme' } },
  M6:  { semis: 9,  name: 'Major 6th',    short: 'M6',
         songs: { asc: 'My Bonnie Lies Over the Ocean', desc: 'Nobody Knows the Trouble I\'ve Seen' } },
  m7:  { semis: 10, name: 'Minor 7th',    short: 'm7',
         songs: { asc: 'Somewhere (West Side Story)', desc: 'Watermelon Man' } },
  M7:  { semis: 11, name: 'Major 7th',    short: 'M7',
         songs: { asc: 'Take On Me (chorus)', desc: 'I Love You (Cole Porter)' } },
  P8:  { semis: 12, name: 'Octave',       short: 'P8',
         songs: { asc: 'Somewhere Over the Rainbow', desc: 'Willow Weep for Me' } },
  m9:  { semis: 13, name: 'Minor 9th',    short: 'm9', songs: {} },
  M9:  { semis: 14, name: 'Major 9th',    short: 'M9', songs: {} },
  P11: { semis: 17, name: 'Perfect 11th', short: 'P11', songs: {} },
  P12: { semis: 19, name: 'Perfect 12th', short: 'P12', songs: {} },
};

export const DIRECTIONS = {
  a: { name: 'Ascending',  symbol: '↑' },
  d: { name: 'Descending', symbol: '↓' },
  h: { name: 'Harmonic',   symbol: '⇈' },
};

// ── Chords ───────────────────────────────────────────────────────────────────
// semis are offsets from the lowest sounding note (so inversions are literal voicings).
export const CHORDS = {
  maj:   { semis: [0, 4, 7],          name: 'Major',           short: 'maj' },
  min:   { semis: [0, 3, 7],          name: 'Minor',           short: 'min' },
  dim:   { semis: [0, 3, 6],          name: 'Diminished',      short: 'dim' },
  aug:   { semis: [0, 4, 8],          name: 'Augmented',       short: 'aug' },
  sus2:  { semis: [0, 2, 7],          name: 'Sus2',            short: 'sus2' },
  sus4:  { semis: [0, 5, 7],          name: 'Sus4',            short: 'sus4' },
  dom7:  { semis: [0, 4, 7, 10],      name: 'Dominant 7th',    short: '7' },
  maj7:  { semis: [0, 4, 7, 11],      name: 'Major 7th',       short: 'maj7' },
  min7:  { semis: [0, 3, 7, 10],      name: 'Minor 7th',       short: 'm7' },
  m7b5:  { semis: [0, 3, 6, 10],      name: 'Half-diminished', short: 'm7♭5' },
  dim7:  { semis: [0, 3, 6, 9],       name: 'Diminished 7th',  short: 'dim7' },
  mM7:   { semis: [0, 3, 7, 11],      name: 'Minor-major 7th', short: 'mM7' },
  maj6:  { semis: [0, 4, 7, 9],       name: 'Major 6th',       short: '6' },
  min6:  { semis: [0, 3, 7, 9],       name: 'Minor 6th',       short: 'm6' },
  dom9:  { semis: [0, 4, 7, 10, 14],  name: 'Dominant 9th',    short: '9' },
  maj9:  { semis: [0, 4, 7, 11, 14],  name: 'Major 9th',       short: 'maj9' },
  min9:  { semis: [0, 3, 7, 10, 14],  name: 'Minor 9th',       short: 'm9' },
  maj_1: { semis: [0, 3, 8],          name: 'Major · 1st inv', short: 'maj/3' },
  maj_2: { semis: [0, 5, 9],          name: 'Major · 2nd inv', short: 'maj/5' },
  min_1: { semis: [0, 4, 9],          name: 'Minor · 1st inv', short: 'min/♭3' },
  min_2: { semis: [0, 5, 8],          name: 'Minor · 2nd inv', short: 'min/5' },
};

// ── Scales ───────────────────────────────────────────────────────────────────
export const SCALES = {
  major:    { semis: [0, 2, 4, 5, 7, 9, 11, 12],  name: 'Major',           sub: 'Ionian' },
  natmin:   { semis: [0, 2, 3, 5, 7, 8, 10, 12],  name: 'Natural Minor',   sub: 'Aeolian' },
  harmmin:  { semis: [0, 2, 3, 5, 7, 8, 11, 12],  name: 'Harmonic Minor' },
  melmin:   { semis: [0, 2, 3, 5, 7, 9, 11, 12],  name: 'Melodic Minor',   sub: 'ascending' },
  majpent:  { semis: [0, 2, 4, 7, 9, 12],         name: 'Major Pentatonic' },
  minpent:  { semis: [0, 3, 5, 7, 10, 12],        name: 'Minor Pentatonic' },
  blues:    { semis: [0, 3, 5, 6, 7, 10, 12],     name: 'Blues' },
  dorian:   { semis: [0, 2, 3, 5, 7, 9, 10, 12],  name: 'Dorian' },
  phrygian: { semis: [0, 1, 3, 5, 7, 8, 10, 12],  name: 'Phrygian' },
  lydian:   { semis: [0, 2, 4, 6, 7, 9, 11, 12],  name: 'Lydian' },
  mixolydian: { semis: [0, 2, 4, 5, 7, 9, 10, 12], name: 'Mixolydian' },
  locrian:  { semis: [0, 1, 3, 5, 6, 8, 10, 12],  name: 'Locrian' },
  wholetone: { semis: [0, 2, 4, 6, 8, 10, 12],    name: 'Whole Tone' },
  dimhw:    { semis: [0, 1, 3, 4, 6, 7, 9, 10, 12], name: 'Diminished',    sub: 'half-whole' },
  phrygdom: { semis: [0, 1, 4, 5, 7, 8, 10, 12],  name: 'Phrygian Dominant' },
};

// ── Scale degrees ────────────────────────────────────────────────────────────
// id is unique per semitone offset from the tonic.
export const DEGREES = {
  do:  { semis: 0,  solfege: 'Do',  number: '1' },
  ra:  { semis: 1,  solfege: 'Ra',  number: '♭2' },
  re:  { semis: 2,  solfege: 'Re',  number: '2' },
  me:  { semis: 3,  solfege: 'Me',  number: '♭3' },
  mi:  { semis: 4,  solfege: 'Mi',  number: '3' },
  fa:  { semis: 5,  solfege: 'Fa',  number: '4' },
  fi:  { semis: 6,  solfege: 'Fi',  number: '♯4' },
  sol: { semis: 7,  solfege: 'Sol', number: '5' },
  le:  { semis: 8,  solfege: 'Le',  number: '♭6' },
  la:  { semis: 9,  solfege: 'La',  number: '6' },
  te:  { semis: 10, solfege: 'Te',  number: '♭7' },
  ti:  { semis: 11, solfege: 'Ti',  number: '7' },
};

// ── Roman numerals (functional progressions) ─────────────────────────────────
// root = semitones above the key tonic; quality maps into CHORDS.
export const NUMERALS = {
  I:    { root: 0,  quality: 'maj', name: 'I' },
  ii:   { root: 2,  quality: 'min', name: 'ii' },
  iii:  { root: 4,  quality: 'min', name: 'iii' },
  IV:   { root: 5,  quality: 'maj', name: 'IV' },
  V:    { root: 7,  quality: 'maj', name: 'V' },
  vi:   { root: 9,  quality: 'min', name: 'vi' },
  i:    { root: 0,  quality: 'min', name: 'i' },
  iv:   { root: 5,  quality: 'min', name: 'iv' },
  VI:   { root: 8,  quality: 'maj', name: 'VI' },
  VII:  { root: 10, quality: 'maj', name: 'VII' },
};

// Cadences used to establish a key before functional questions.
export const CADENCES = {
  major: ['I', 'IV', 'V', 'I'],
  minor: ['i', 'iv', 'V', 'i'],
};

export function randInt(lo, hi) { // inclusive
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Weighted pick: weights array parallel to items.
export function weightedChoice(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
