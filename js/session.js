// session.js — the practice screen: question loop, answer UIs for choice /
// sequence / melody questions, feedback, level-completion celebration, and the
// mixed "daily workout".

import { h, go } from './ui.js';
import * as Audio from './audio.js';
import * as Engine from './engine.js';
import * as State from './state.js';
import { MODULES, moduleById } from './curriculum.js';
import { createPiano } from './piano.js';
import { midiName } from './theory.js';
import { track } from './analytics.js';

export function renderPractice(root, moduleId, levelIdx) {
  const mod = moduleById(moduleId);
  const level = mod.levels[levelIdx];
  if (!level) { go('#/'); return () => {}; }
  return runSession(root, {
    title: mod.title,
    subtitle: `Level ${levelIdx + 1} · ${level.name}`,
    color: mod.color,
    moduleId, levelIdx,
    next: () => Engine.generate(moduleId, levelIdx),
  });
}

export function renderDaily(root) {
  const candidates = MODULES.filter(m => State.moduleStarted(m.id));
  if (!candidates.length) { go('#/'); return () => {}; }
  return runSession(root, {
    title: 'Daily workout',
    subtitle: 'Mixed practice from your current levels',
    color: 'amber',
    daily: { total: 15 },
    next: () => {
      const m = candidates[Math.floor(Math.random() * candidates.length)];
      return Engine.generate(m.id, State.currentLevelIndex(m.id));
    },
  });
}

function runSession(root, cfg) {
  track('session_start', {
    module: cfg.moduleId, level: cfg.levelIdx, daily: !!cfg.daily,
  });
  let q = null;
  let answered = false;
  let everPlayed = false;     // becomes true after the first user-initiated play
  let sessionN = 0, sessionC = 0;
  let dailyDone = 0;
  let autoTimer = null;
  let piano = null;
  let userSeq = [];           // sequence answers
  let userMidis = [];         // melody answers
  let optionBtns = [];

  // ── static shell ───────────────────────────────────────────────────────────
  const playBtn = h('button', { class: 'playbtn', 'aria-label': 'Play / replay', onclick: () => playQ() }, '▶');
  const promptEl = h('div', { class: 's-prompt' });
  const chipEl = h('div', { class: 's-chip' });
  const goalEl = h('div', { class: 's-goal' });
  const answersEl = h('div', { class: 's-answers' });
  const feedbackEl = h('div', { class: 's-feedback' });
  const actionsEl = h('div', { class: 's-actions' });
  const scoreEl = h('div', { class: 's-score' });
  const overlayEl = h('div', { class: 'overlay hidden' });

  const shell = h('div', { class: 'session', style: { '--mc': `var(--c-${cfg.color})` } },
    h('header', { class: 's-head' },
      h('button', {
        class: 'iconbtn', 'aria-label': 'Back',
        onclick: () => go(cfg.daily ? '#/' : `#/module/${cfg.moduleId}`),
      }, '←'),
      h('div', { class: 's-title' },
        h('div', {}, cfg.title),
        h('div', { class: 's-sub' }, cfg.subtitle)),
      scoreEl),
    h('main', { class: 's-body' },
      h('div', { class: 's-stage' }, playBtn, chipEl, promptEl, goalEl),
      answersEl, feedbackEl, actionsEl,
      h('div', { class: 's-kbd' }, '1–9 answer · R replay · ⏎ next · ⌫ undo')),
    overlayEl);
  root.append(shell);

  // ── helpers ────────────────────────────────────────────────────────────────
  function updateScore() {
    if (cfg.daily) {
      scoreEl.textContent = `${dailyDone}/${cfg.daily.total} · ✓ ${sessionC}`;
    } else {
      scoreEl.textContent = sessionN ? `✓ ${sessionC}/${sessionN}` : '';
    }
  }

  function updateGoal() {
    if (cfg.daily) { goalEl.textContent = ''; return; }
    const mod = moduleById(cfg.moduleId);
    const ls = State.levelStats(cfg.moduleId, cfg.levelIdx);
    if (ls.completedAt) {
      goalEl.textContent = 'Level complete · free practice';
    } else {
      const got = ls.recent.slice(-mod.window).reduce((a, b) => a + b, 0);
      goalEl.textContent = `Goal: ${mod.need} of your last ${mod.window} · now ${got}/${mod.need}`;
    }
  }

  async function playQ() {
    if (!q) return;
    everPlayed = true;
    playBtn.classList.add('playing');
    shell.classList.remove('awaiting-play');
    try { await q.play(); } finally { playBtn.classList.remove('playing'); }
    playBtn.textContent = '↻';
  }

  function clearAuto() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  }

  function nextQuestion() {
    clearAuto();
    q = cfg.next();
    answered = false;
    userSeq = [];
    userMidis = [];
    piano = null;
    feedbackEl.innerHTML = '';
    actionsEl.innerHTML = '';
    answersEl.innerHTML = '';
    playBtn.textContent = '▶';
    promptEl.textContent = q.prompt;
    chipEl.textContent = '';
    if (cfg.daily) {
      const m = moduleById(q.moduleId);
      chipEl.textContent = `${m.icon} ${m.title}`;
      shell.style.setProperty('--mc', `var(--c-${m.color})`);
    }
    renderAnswers();
    updateScore();
    updateGoal();
    if (everPlayed) playQ();
    else shell.classList.add('awaiting-play');
  }

  function finishAnswer(result, extraFeedback) {
    answered = true;
    sessionN++;
    if (result.correct) sessionC++;
    const justCompleted = State.recordAnswer(
      q.moduleId, q.levelIdx, result.itemResults, result.correct,
      result.confusion);
    updateScore();
    updateGoal();
    if (cfg.daily) dailyDone++;
    track('question_answered', {
      module: q.moduleId, level: q.levelIdx, kind: q.kind,
      correct: result.correct, daily: !!cfg.daily,
    });

    renderFeedback(result, extraFeedback);

    if (cfg.daily && dailyDone >= cfg.daily.total) {
      track('daily_complete', { correct: sessionC, total: cfg.daily.total });
      setTimeout(() => showDailySummary(), result.correct ? 900 : 2200);
      return;
    }
    if (justCompleted && !cfg.daily) {
      track('level_complete', { module: cfg.moduleId, level: cfg.levelIdx });
      setTimeout(() => showCelebration(), result.correct ? 900 : 1800);
      return;
    }
    const nextBtn = h('button', { class: 'btn primary', onclick: nextQuestion }, 'Next →');
    actionsEl.append(nextBtn);
    if (result.correct && State.state.settings.autoAdvance) {
      autoTimer = setTimeout(nextQuestion, 1100);
    } else {
      nextBtn.focus();
    }
  }

  function renderFeedback(result, extra = []) {
    feedbackEl.innerHTML = '';
    const box = h('div', { class: `fb ${result.correct ? 'good' : 'bad'}` });
    box.append(h('div', { class: 'fb-line' }, result.correct ? '✓ Correct' : '✗ Not quite'));
    for (const node of extra) box.append(node);
    feedbackEl.append(box);
  }

  // ── answer UIs ─────────────────────────────────────────────────────────────
  function renderAnswers() {
    if (q.kind === 'choice') renderChoice();
    else if (q.kind === 'sequence') renderSequence();
    else renderMelody();
  }

  // choice ────────────────────────────────────────────────────────────────────
  function renderChoice() {
    optionBtns = q.options.map((opt, i) =>
      h('button', { class: 'opt', onclick: () => answerChoice(opt.id) },
        i < 10 ? h('span', { class: 'opt-kbd' }, String((i + 1) % 10)) : null,
        h('span', { class: 'opt-label' }, opt.label),
        opt.sub ? h('span', { class: 'opt-sub' }, opt.sub) : null));
    answersEl.append(h('div', { class: 'opt-grid' }, optionBtns));
  }

  function answerChoice(id) {
    if (answered || !everPlayed) return;
    const result = q.grade(id);
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i], btn = optionBtns[i];
      btn.disabled = true;
      if (opt.id === q.answerId) btn.classList.add('good');
      else if (opt.id === id) btn.classList.add('bad');
      else btn.classList.add('dim');
    }
    const extra = [];
    const correctOpt = q.options.find(o => o.id === q.answerId);
    if (!result.correct) {
      const yourOpt = q.options.find(o => o.id === id);
      extra.push(h('div', { class: 'fb-detail' },
        `It was ${correctOpt.label} — you chose ${yourOpt.label}.`));
      if (q.playOption) {
        extra.push(h('div', { class: 'fb-compare' },
          h('button', { class: 'btn small', onclick: () => q.playOption(id) }, '▶ Your pick'),
          h('button', { class: 'btn small', onclick: () => q.playOption(q.answerId) }, '▶ Answer')));
      }
    } else {
      extra.push(h('div', { class: 'fb-detail' }, correctOpt.label));
    }
    if (q.mnemonic) extra.push(h('div', { class: 'fb-mnemonic' }, `♪ ${q.mnemonic}`));
    finishAnswer(result, extra);
  }

  // sequence (progressions) ───────────────────────────────────────────────────
  let slotEls = [];

  function renderSequence() {
    userSeq = q.answerSeq.map((n, i) => (q.given[i] ? n : null));
    slotEls = q.answerSeq.map((_, i) =>
      h('div', { class: 'slot' + (q.given[i] ? ' given' : '') },
        q.given[i] ? q.answerSeq[i] : '·'));
    optionBtns = q.options.map((opt, i) =>
      h('button', { class: 'opt numeral', onclick: () => fillSlot(opt.id) },
        i < 10 ? h('span', { class: 'opt-kbd' }, String((i + 1) % 10)) : null,
        h('span', { class: 'opt-label' }, opt.label)));
    answersEl.append(
      h('div', { class: 'slots' }, slotEls),
      h('div', { class: 'opt-grid numerals' }, optionBtns),
      h('div', { class: 'seq-tools' },
        h('button', { class: 'btn small', onclick: undoSlot }, '⌫ Undo')));
  }

  function fillSlot(id) {
    if (answered || !everPlayed) return;
    const i = userSeq.findIndex(v => v === null);
    if (i === -1) return;
    userSeq[i] = id;
    slotEls[i].textContent = id;
    slotEls[i].classList.add('filled');
    if (!userSeq.includes(null)) submitSequence();
  }

  function undoSlot() {
    if (answered) return;
    for (let i = userSeq.length - 1; i >= 0; i--) {
      if (!q.given[i] && userSeq[i] !== null) {
        userSeq[i] = null;
        slotEls[i].textContent = '·';
        slotEls[i].classList.remove('filled');
        return;
      }
    }
  }

  function submitSequence() {
    const result = q.grade(userSeq);
    optionBtns.forEach(b => (b.disabled = true));
    for (let i = 0; i < q.answerSeq.length; i++) {
      slotEls[i].classList.add(userSeq[i] === q.answerSeq[i] ? 'good' : 'bad');
    }
    const extra = [];
    if (!result.correct) {
      extra.push(h('div', { class: 'fb-detail' },
        `Answer: ${q.answerSeq.join(' – ')}`));
    } else {
      extra.push(h('div', { class: 'fb-detail' }, q.answerSeq.join(' – ')));
    }
    extra.push(h('div', { class: 'fb-compare' },
      h('button', { class: 'btn small', onclick: () => q.playProgressionOnly() }, '▶ Chords only'),
      h('button', { class: 'btn small', onclick: () => q.play() }, '▶ With cadence')));
    finishAnswer(result, extra);
  }

  // melody (dictation) ────────────────────────────────────────────────────────
  function renderMelody() {
    userMidis = q.firstGiven ? [q.targetMidis[0]] : [];
    slotEls = q.targetMidis.map((m, i) =>
      h('div', { class: 'slot note' + (q.firstGiven && i === 0 ? ' given' : '') },
        q.firstGiven && i === 0 ? midiName(m) : '·'));

    const pianoWrap = h('div', { class: 'piano-wrap' });
    answersEl.append(
      h('div', { class: 'slots' }, slotEls),
      pianoWrap,
      h('div', { class: 'seq-tools' },
        h('button', { class: 'btn small', onclick: undoNote }, '⌫ Undo')));

    piano = createPiano(pianoWrap, q.keyRange[0], q.keyRange[1], {
      tonic: q.tonicMidi,
      onKey: midi => {
        if (answered || !everPlayed) return;
        if (userMidis.length >= q.targetMidis.length) return;
        userMidis.push(midi);
        const i = userMidis.length - 1;
        slotEls[i].textContent = midiName(midi);
        slotEls[i].classList.add('filled');
        if (userMidis.length === q.targetMidis.length) submitMelody();
      },
    });
    if (q.firstGiven) piano.highlight(q.targetMidis[0], 'hl');
  }

  function undoNote() {
    if (answered) return;
    const min = q.firstGiven ? 1 : 0;
    if (userMidis.length <= min) return;
    userMidis.pop();
    const i = userMidis.length;
    slotEls[i].textContent = '·';
    slotEls[i].classList.remove('filled');
  }

  function submitMelody() {
    const result = q.grade(userMidis);
    piano.setEnabled(false);
    for (let i = 0; i < q.targetMidis.length; i++) {
      slotEls[i].classList.add(userMidis[i] === q.targetMidis[i] ? 'good' : 'bad');
    }
    const extra = [];
    if (!result.correct) {
      extra.push(h('div', { class: 'fb-detail' },
        `Answer: ${q.targetMidis.map(midiName).join(' ')}`));
      extra.push(h('div', { class: 'fb-compare' },
        h('button', { class: 'btn small', onclick: () => q.playMelodyOnly() }, '▶ Melody'),
        h('button', { class: 'btn small', onclick: showOnPiano }, '👆 Show on piano')));
    }
    finishAnswer(result, extra);
  }

  function showOnPiano() {
    const tempo = State.state.settings.melodyTempo;
    piano.clear();
    q.playMelodyOnly();
    q.targetMidis.forEach((m, i) => {
      setTimeout(() => piano.flash(m, 'hl-good', tempo * 880), i * tempo * 1000);
    });
  }

  // ── overlays ───────────────────────────────────────────────────────────────
  function showCelebration() {
    const mod = moduleById(cfg.moduleId);
    const nextIdx = cfg.levelIdx + 1;
    const hasNext = nextIdx < mod.levels.length;
    overlayEl.innerHTML = '';
    overlayEl.classList.remove('hidden');
    overlayEl.append(h('div', { class: 'celebrate' },
      h('div', { class: 'celebrate-emoji' }, '🎉'),
      h('div', { class: 'celebrate-title' }, 'Level complete!'),
      h('div', { class: 'celebrate-sub' },
        `${mod.title} · ${mod.levels[cfg.levelIdx].name}`),
      h('div', { class: 'celebrate-actions' },
        hasNext ? h('button', {
          class: 'btn primary',
          onclick: () => { go(`#/practice/${cfg.moduleId}/${nextIdx}`); },
        }, `Next: ${mod.levels[nextIdx].name} →`) : null,
        h('button', {
          class: 'btn',
          onclick: () => { overlayEl.classList.add('hidden'); nextQuestion(); },
        }, 'Keep practicing'),
        h('button', { class: 'btn ghost', onclick: () => go('#/') }, 'Home'))));
  }

  function showDailySummary() {
    overlayEl.innerHTML = '';
    overlayEl.classList.remove('hidden');
    const pct = Math.round((sessionC / cfg.daily.total) * 100);
    overlayEl.append(h('div', { class: 'celebrate' },
      h('div', { class: 'celebrate-emoji' }, pct >= 80 ? '🔥' : pct >= 50 ? '💪' : '🌱'),
      h('div', { class: 'celebrate-title' }, 'Workout complete'),
      h('div', { class: 'celebrate-sub' },
        `${sessionC} of ${cfg.daily.total} correct (${pct}%)`),
      h('div', { class: 'celebrate-actions' },
        h('button', { class: 'btn primary', onclick: () => go('#/') }, 'Done'),
        h('button', {
          class: 'btn',
          onclick: () => {
            overlayEl.classList.add('hidden');
            sessionN = 0; sessionC = 0; dailyDone = 0;
            nextQuestion();
          },
        }, 'Go again'))));
  }

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
  function onKeydown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (!overlayEl.classList.contains('hidden')) return;
    if (e.key === 'r' || e.key === 'R') { Audio.unlock(); playQ(); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      Audio.unlock();
      if (answered) { clearAuto(); nextQuestion(); }
      else if (!everPlayed) playQ();
      return;
    }
    if (e.key === 'Backspace') {
      if (q?.kind === 'sequence') { e.preventDefault(); undoSlot(); }
      if (q?.kind === 'melody') { e.preventDefault(); undoNote(); }
      return;
    }
    if (/^[0-9]$/.test(e.key) && !answered) {
      const idx = e.key === '0' ? 9 : Number(e.key) - 1;
      Audio.unlock();
      if (q?.kind === 'choice' && q.options[idx]) answerChoice(q.options[idx].id);
      if (q?.kind === 'sequence' && q.options[idx]) fillSlot(q.options[idx].id);
    }
  }
  document.addEventListener('keydown', onKeydown);

  // Any tap in the session unlocks audio (iOS) before it's needed.
  shell.addEventListener('pointerdown', () => Audio.unlock());

  nextQuestion();

  return () => {
    document.removeEventListener('keydown', onKeydown);
    clearAuto();
    Audio.stopAll();
  };
}
