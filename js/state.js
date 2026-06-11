// state.js — persistence, progress tracking, streaks and settings (localStorage).

import { MODULES, moduleById } from './curriculum.js';

const KEY = 'earpath-v1';

const DEFAULT_SETTINGS = {
  volume: 0.9,
  autoAdvance: true,
  chordStyle: 'block+arp',   // 'block' | 'block+arp' | 'arp'
  degreeLabels: 'solfege',   // 'solfege' | 'number'
  melodyTempo: 0.55,         // seconds per note
  freeRoam: false,           // true = every level unlocked, practice anything
};

function blank() {
  return {
    version: 1,
    onboarded: false,
    settings: { ...DEFAULT_SETTINGS },
    preUnlock: {},                  // moduleId -> levels unlocked by onboarding
    items: {},                      // itemKey -> {a, c, recent: [0|1]}
    levels: {},                     // 'moduleId:idx' -> {a, c, recent: [0|1], completedAt}
    confusions: {},                 // 'moduleId|correct>answered' -> count
    activity: {},                   // 'YYYY-MM-DD' -> {a, c}
    streak: { current: 0, best: 0, lastDay: null },
    lastPracticed: null,            // moduleId
    totals: { a: 0, c: 0 },
  };
}

export let state = blank();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state = { ...blank(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
    }
  } catch (e) {
    console.warn('earpath: could not load saved state', e);
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('earpath: could not save state', e);
  }
}

export function resetAll() {
  state = blank();
  save();
}

const today = () => new Date().toISOString().slice(0, 10);

function bumpStreak() {
  const day = today();
  const s = state.streak;
  if (s.lastDay === day) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.current = s.lastDay === yesterday ? s.current + 1 : 1;
  s.best = Math.max(s.best, s.current);
  s.lastDay = day;
}

// ── Item + level stats ───────────────────────────────────────────────────────

const RECENT_CAP = 20;

export function itemStats(key) {
  return state.items[key] || { a: 0, c: 0, recent: [] };
}

export function levelKey(moduleId, idx) {
  return `${moduleId}:${idx}`;
}

export function levelStats(moduleId, idx) {
  return state.levels[levelKey(moduleId, idx)] || { a: 0, c: 0, recent: [], completedAt: null };
}

// Recent accuracy over the item's last n answers; optimistic 1.0 when unseen
// is avoided — unseen items get priority via the weight function instead.
export function itemRecentAccuracy(key, n = 10) {
  const recent = itemStats(key).recent.slice(-n);
  if (!recent.length) return null;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

// Selection weight: unseen and recently-missed items come up more often.
export function itemWeight(key) {
  const st = itemStats(key);
  if (st.a < 3) return 3;                       // new item: prioritise
  const acc = itemRecentAccuracy(key) ?? 0;
  return 1 + 4 * (1 - acc);
}

// Record one answered question.
// itemResults: [{key, correct}] for each skill exercised (per-slot for
// sequences); correct: whole-question correctness, which drives level progress.
export function recordAnswer(moduleId, levelIdx, itemResults, correct, confusion = null) {
  for (const { key, correct: ok } of itemResults) {
    const st = state.items[key] || { a: 0, c: 0, recent: [] };
    st.a += 1;
    if (ok) st.c += 1;
    st.recent.push(ok ? 1 : 0);
    if (st.recent.length > RECENT_CAP) st.recent.shift();
    state.items[key] = st;
  }

  const lk = levelKey(moduleId, levelIdx);
  const ls = state.levels[lk] || { a: 0, c: 0, recent: [], completedAt: null };
  ls.a += 1;
  if (correct) ls.c += 1;
  ls.recent.push(correct ? 1 : 0);
  if (ls.recent.length > RECENT_CAP) ls.recent.shift();
  state.levels[lk] = ls;

  if (confusion && confusion.correctId !== confusion.answeredId) {
    const ck = `${moduleId}|${confusion.correctId}>${confusion.answeredId}`;
    state.confusions[ck] = (state.confusions[ck] || 0) + 1;
  }

  const day = today();
  const act = state.activity[day] || { a: 0, c: 0 };
  act.a += 1;
  if (correct) act.c += 1;
  state.activity[day] = act;

  state.totals.a += 1;
  if (correct) state.totals.c += 1;
  state.lastPracticed = moduleId;
  bumpStreak();

  // Level completion check: NEED of last WINDOW correct, after >= WINDOW answers.
  const mod = moduleById(moduleId);
  let justCompleted = false;
  if (!ls.completedAt && ls.a >= mod.window) {
    const win = ls.recent.slice(-mod.window);
    const got = win.reduce((a, b) => a + b, 0);
    if (got >= mod.need) {
      ls.completedAt = Date.now();
      justCompleted = true;
    }
  }

  save();
  return justCompleted;
}

// Progress toward completion, 0..1 (for the level ring).
export function levelProgress(moduleId, idx) {
  const mod = moduleById(moduleId);
  const ls = levelStats(moduleId, idx);
  if (ls.completedAt) return 1;
  const win = ls.recent.slice(-mod.window);
  const got = win.reduce((a, b) => a + b, 0);
  return Math.min(got / mod.need, 0.97); // never shows full until actually complete
}

export function isLevelComplete(moduleId, idx) {
  return !!levelStats(moduleId, idx).completedAt;
}

export function isLevelUnlocked(moduleId, idx) {
  if (state.settings.freeRoam) return true;
  if (idx === 0) return true;
  if ((state.preUnlock[moduleId] || 0) > idx) return true;
  return isLevelComplete(moduleId, idx - 1);
}

// The level "Continue" sends you to: the first incomplete unlocked level at or
// after your frontier — the furthest of (onboarding pre-unlock, last level with
// any activity) — so skipping ahead via onboarding actually skips.
export function currentLevelIndex(moduleId) {
  const mod = moduleById(moduleId);
  const pre = Math.min(state.preUnlock[moduleId] || 0, mod.levels.length) - 1;
  let active = -1;
  for (let i = 0; i < mod.levels.length; i++) {
    if (levelStats(moduleId, i).a > 0) active = i;
  }
  const start = Math.max(0, pre, active);
  for (let i = start; i < mod.levels.length; i++) {
    if (!isLevelComplete(moduleId, i) && isLevelUnlocked(moduleId, i)) return i;
  }
  for (let i = 0; i < mod.levels.length; i++) {
    if (!isLevelComplete(moduleId, i) && isLevelUnlocked(moduleId, i)) return i;
  }
  return mod.levels.length - 1;
}

export function moduleCompletedCount(moduleId) {
  const mod = moduleById(moduleId);
  let n = 0;
  for (let i = 0; i < mod.levels.length; i++) if (isLevelComplete(moduleId, i)) n++;
  return n;
}

export function moduleStarted(moduleId) {
  const mod = moduleById(moduleId);
  for (let i = 0; i < mod.levels.length; i++) {
    if (levelStats(moduleId, i).a > 0) return true;
  }
  return false;
}

// Recommendation for the home "Continue" card. Before any practice, suggest
// the first module the onboarding path didn't mark as fully skipped.
export function recommendation() {
  const last = state.lastPracticed;
  if (last && moduleById(last)) {
    return { moduleId: last, levelIdx: currentLevelIndex(last) };
  }
  for (const mod of MODULES) {
    if ((state.preUnlock[mod.id] || 0) < mod.levels.length) {
      return { moduleId: mod.id, levelIdx: currentLevelIndex(mod.id) };
    }
  }
  return { moduleId: 'pitch', levelIdx: 0 };
}

export function topConfusions(limit = 8) {
  return Object.entries(state.confusions)
    .map(([k, count]) => {
      const [moduleId, pair] = k.split('|');
      const [correctId, answeredId] = pair.split('>');
      return { moduleId, correctId, answeredId, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function applyOnboarding(pathUnlocks) {
  state.preUnlock = { ...pathUnlocks };
  state.onboarded = true;
  save();
}

// ── Export / import ──────────────────────────────────────────────────────────

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (typeof data !== 'object' || data === null || data.version !== 1) {
    throw new Error('Not a valid earpath backup file.');
  }
  state = { ...blank(), ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
  save();
}
