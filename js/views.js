// views.js — home dashboard, module pages, stats, settings, guide, onboarding.

import { h, ring, fmtPct, go } from './ui.js';
import * as State from './state.js';
import * as Audio from './audio.js';
import { MODULES, moduleById, ONBOARDING_PATHS } from './curriculum.js';
import { INTERVALS, CHORDS, SCALES, DEGREES } from './theory.js';
import { track } from './analytics.js';
import { APP_VERSION, REPO_URL } from './config.js';

// ── shared chrome ─────────────────────────────────────────────────────────────

function topbar(active = '') {
  const link = (route, label, key) =>
    h('a', { class: 'nav-link' + (active === key ? ' active' : ''), href: route }, label);
  return h('header', { class: 'topbar' },
    h('a', { class: 'logo', href: '#/' }, h('span', { class: 'logo-mark' }, '◖♪'), 'earpath'),
    h('nav', { class: 'nav' },
      link('#/guide', 'Guide', 'guide'),
      link('#/stats', 'Stats', 'stats'),
      link('#/settings', 'Settings', 'settings')));
}

// ── home ──────────────────────────────────────────────────────────────────────

export function renderHome(root) {
  const rec = State.recommendation();
  const recMod = moduleById(rec.moduleId);
  const recLevel = recMod.levels[rec.levelIdx];
  const streak = State.state.streak;
  const anyStarted = MODULES.some(m => State.moduleStarted(m.id));

  const page = h('div', { class: 'page' },
    topbar(),
    streak.current > 0
      ? h('div', { class: 'streak-banner' },
          `🔥 ${streak.current}-day streak`,
          streak.best > streak.current ? h('span', { class: 'muted' }, ` · best ${streak.best}`) : null)
      : null,

    h('section', { class: 'hero-row' },
      h('button', {
        class: 'card continue-card',
        style: { '--mc': `var(--c-${recMod.color})` },
        onclick: () => go(`#/practice/${rec.moduleId}/${rec.levelIdx}`),
      },
        h('div', { class: 'cc-icon' }, recMod.icon),
        h('div', { class: 'cc-text' },
          h('div', { class: 'cc-kicker' }, anyStarted ? 'Continue' : 'Start here'),
          h('div', { class: 'cc-title' }, `${recMod.title} · ${recLevel.name}`),
          h('div', { class: 'cc-sub' }, recLevel.hint)),
        ring(State.levelProgress(rec.moduleId, rec.levelIdx), 48, 5)),
      anyStarted
        ? h('button', {
            class: 'card daily-card',
            onclick: () => go('#/daily'),
          },
            h('div', { class: 'cc-icon' }, '⚡'),
            h('div', { class: 'cc-text' },
              h('div', { class: 'cc-kicker' }, 'Daily workout'),
              h('div', { class: 'cc-sub' }, '15 mixed questions, weighted toward your weak spots')))
        : null),

    h('section', { class: 'module-grid' },
      MODULES.map(mod => {
        const done = State.moduleCompletedCount(mod.id);
        const cur = State.currentLevelIndex(mod.id);
        return h('button', {
          class: 'card module-card',
          style: { '--mc': `var(--c-${mod.color})` },
          onclick: () => go(`#/module/${mod.id}`),
        },
          h('div', { class: 'mc-head' },
            h('span', { class: 'mc-icon' }, mod.icon),
            h('span', { class: 'mc-title' }, mod.title),
            h('span', { class: 'mc-count' }, `${done}/${mod.levels.length}`)),
          h('div', { class: 'mc-blurb' }, mod.blurb),
          h('div', { class: 'mc-dots' },
            mod.levels.map((_, i) => {
              let cls = 'dot';
              if (State.isLevelComplete(mod.id, i)) cls += ' done';
              else if (i === cur && State.isLevelUnlocked(mod.id, i)) cls += ' current';
              else if (!State.isLevelUnlocked(mod.id, i)) cls += ' locked';
              return h('span', { class: cls });
            })));
      })),

    h('footer', { class: 'foot' },
      h('span', {}, 'earpath — free & open source ear training. '),
      h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'GitHub'),
      h('span', {}, ` · v${APP_VERSION} · `),
      h('a', { href: `${REPO_URL}/blob/main/CHANGELOG.md`, target: '_blank', rel: 'noopener' }, 'changelog')));

  root.append(page);
  if (!State.state.onboarded) root.append(onboardingOverlay());
  return () => {};
}

function onboardingOverlay() {
  const overlay = h('div', { class: 'overlay' });
  overlay.append(h('div', { class: 'onboard' },
    h('div', { class: 'onboard-logo' }, '◖♪'),
    h('h1', {}, 'Welcome to earpath'),
    h('p', { class: 'muted' },
      'A few minutes a day is all it takes. Where should we start you?'),
    h('div', { class: 'onboard-paths' },
      Object.entries(ONBOARDING_PATHS).map(([key, path]) =>
        h('button', {
          class: 'card path-card',
          onclick: () => {
            State.applyOnboarding(path.unlocks);
            track('onboarding_path', { path: key });
            overlay.remove();
            // Re-render home so unlock dots reflect the chosen path.
            go('#/'); window.dispatchEvent(new HashChangeEvent('hashchange'));
          },
        },
          h('div', { class: 'path-label' }, path.label),
          h('div', { class: 'path-desc' }, path.desc)))),
    h('p', { class: 'tiny muted' },
      'You can practice any unlocked level at any time — nothing is ever locked again once opened.')));
  return overlay;
}

// ── module page ───────────────────────────────────────────────────────────────

export function renderModule(root, moduleId) {
  const mod = moduleById(moduleId);
  if (!mod) { go('#/'); return () => {}; }

  const itemLabel = id =>
    moduleId === 'intervals' ? INTERVALS[id].short
    : moduleId === 'chords' ? CHORDS[id].short
    : moduleId === 'scales' ? SCALES[id].name
    : moduleId === 'degrees'
      ? (State.state.settings.degreeLabels === 'number' ? DEGREES[id].number : DEGREES[id].solfege)
    : id;

  const rows = mod.levels.map((level, i) => {
    const unlocked = State.isLevelUnlocked(moduleId, i);
    const complete = State.isLevelComplete(moduleId, i);
    const ls = State.levelStats(moduleId, i);
    const chips = (level.items || level.pool || [])
      .map(id => h('span', { class: 'chip' }, itemLabel(id)));
    if (moduleId === 'pitch' || moduleId === 'melodies') chips.length = 0;

    let status;
    if (complete) status = h('span', { class: 'lv-status done' }, '✓');
    else if (unlocked) status = ring(State.levelProgress(moduleId, i), 34, 4);
    else status = h('span', { class: 'lv-status locked' }, '🔒');

    return h(unlocked ? 'button' : 'div', {
      class: 'card level-row' + (unlocked ? '' : ' locked') + (complete ? ' complete' : ''),
      onclick: unlocked ? () => go(`#/practice/${moduleId}/${i}`) : null,
    },
      h('div', { class: 'lv-num' }, String(i + 1)),
      h('div', { class: 'lv-main' },
        h('div', { class: 'lv-name' }, level.name),
        h('div', { class: 'lv-hint' }, unlocked ? level.hint : 'Complete the previous level to unlock.'),
        chips.length ? h('div', { class: 'lv-chips' }, chips) : null),
      h('div', { class: 'lv-side' },
        ls.a > 0 ? h('span', { class: 'lv-acc' }, fmtPct(ls.c, ls.a)) : null,
        status));
  });

  const page = h('div', { class: 'page', style: { '--mc': `var(--c-${mod.color})` } },
    topbar(),
    h('div', { class: 'mod-head' },
      h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: () => go('#/') }, '←'),
      h('span', { class: 'mod-icon' }, mod.icon),
      h('div', {},
        h('h1', {}, mod.title),
        h('p', { class: 'muted' }, mod.blurb))),
    h('div', { class: 'tipbox' }, h('strong', {}, 'How to listen · '), mod.tip),
    h('div', { class: 'level-list' }, rows));

  root.append(page);
  return () => {};
}

// ── stats ─────────────────────────────────────────────────────────────────────

export function renderStats(root) {
  const s = State.state;
  const totalLevels = MODULES.reduce((n, m) => n + m.levels.length, 0);
  const doneLevels = MODULES.reduce((n, m) => n + State.moduleCompletedCount(m.id), 0);

  // Activity grid: last 12 weeks, columns = weeks, rows = weekdays.
  const cells = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (83 + ((now.getDay() + 6) % 7)));
  for (let w = 0; w < 13; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      if (day > now) { col.push(h('span', { class: 'acell empty' })); continue; }
      const key = day.toISOString().slice(0, 10);
      const a = s.activity[key]?.a || 0;
      const lvl = a === 0 ? 0 : a < 10 ? 1 : a < 30 ? 2 : 3;
      col.push(h('span', { class: `acell l${lvl}`, title: `${key}: ${a} answers` }));
    }
    cells.push(h('div', { class: 'acol' }, col));
  }

  const confusions = State.topConfusions(8);

  const confName = (moduleId, id) =>
    moduleId === 'intervals' ? INTERVALS[id]?.name
    : moduleId === 'chords' ? CHORDS[id]?.name
    : moduleId === 'scales' ? SCALES[id]?.name
    : moduleId === 'degrees' ? DEGREES[id?.split(':').pop()]?.solfege ?? id
    : id;

  function comparePlay(moduleId, id) {
    Audio.unlock();
    Audio.stopAll();
    const root = 60;
    if (moduleId === 'intervals' && INTERVALS[id]) {
      Audio.playEvents(Audio.intervalEvents(root, INTERVALS[id].semis, 'a'));
    } else if (moduleId === 'chords' && CHORDS[id]) {
      Audio.playEvents(Audio.chordEvents(root, CHORDS[id].semis, s.settings.chordStyle));
    } else if (moduleId === 'scales' && SCALES[id]) {
      Audio.playEvents(Audio.scaleEvents(root, SCALES[id].semis));
    } else if (moduleId === 'degrees') {
      const deg = DEGREES[id];
      if (deg) Audio.playEvents([
        { midi: root, at: 0, dur: 0.6 },
        { midi: root + deg.semis, at: 0.75, dur: 0.9 },
      ]);
    }
  }

  const playable = mid => ['intervals', 'chords', 'scales', 'degrees'].includes(mid);

  const page = h('div', { class: 'page' },
    topbar('stats'),
    h('h1', {}, 'Your progress'),
    h('div', { class: 'stat-cards' },
      statCard('🔥', `${s.streak.current}`, 'day streak', `best ${s.streak.best}`),
      statCard('🎯', fmtPct(s.totals.c, s.totals.a), 'accuracy', `${s.totals.a} answers`),
      statCard('⛰', `${doneLevels}/${totalLevels}`, 'levels complete', ''),
      statCard('📅', String(Object.keys(s.activity).length), 'days practiced', '')),

    h('h2', {}, 'Last 12 weeks'),
    h('div', { class: 'agrid' }, cells),

    h('h2', {}, 'Modules'),
    h('div', { class: 'stat-modules' },
      MODULES.map(mod => {
        const done = State.moduleCompletedCount(mod.id);
        let a = 0, c = 0;
        for (let i = 0; i < mod.levels.length; i++) {
          const ls = State.levelStats(mod.id, i);
          a += ls.a; c += ls.c;
        }
        return h('div', { class: 'stat-mod card', style: { '--mc': `var(--c-${mod.color})` } },
          h('span', { class: 'mc-icon' }, mod.icon),
          h('div', { class: 'sm-main' },
            h('div', { class: 'sm-title' }, mod.title),
            h('div', { class: 'sm-bar' },
              h('div', { class: 'sm-fill', style: { width: `${(done / mod.levels.length) * 100}%` } }))),
          h('div', { class: 'sm-side' }, `${done}/${mod.levels.length}`,
            h('div', { class: 'tiny muted' }, a ? `${fmtPct(c, a)} · ${a}` : '—')));
      })),

    confusions.length ? h('h2', {}, 'Often confused') : null,
    confusions.length
      ? h('div', { class: 'confusions' },
          confusions.map(cf => {
            const modTitle = moduleById(cf.moduleId)?.title ?? cf.moduleId;
            const aName = confName(cf.moduleId, cf.correctId) ?? cf.correctId;
            const bName = confName(cf.moduleId, cf.answeredId) ?? cf.answeredId;
            return h('div', { class: 'card confusion-row' },
              h('div', { class: 'cf-main' },
                h('div', {}, h('strong', {}, aName), ' heard as ', h('strong', {}, bName)),
                h('div', { class: 'tiny muted' }, `${modTitle} · ${cf.count}×`)),
              playable(cf.moduleId)
                ? h('div', { class: 'cf-btns' },
                    h('button', { class: 'btn small', onclick: () => comparePlay(cf.moduleId, cf.correctId) }, `▶ ${aName}`),
                    h('button', { class: 'btn small', onclick: () => comparePlay(cf.moduleId, cf.answeredId) }, `▶ ${bName}`))
                : null);
          }))
      : null);

  root.append(page);
  return () => { Audio.stopAll(); };
}

function statCard(icon, big, label, sub) {
  return h('div', { class: 'card stat-card' },
    h('div', { class: 'sc-icon' }, icon),
    h('div', { class: 'sc-big' }, big),
    h('div', { class: 'sc-label' }, label),
    sub ? h('div', { class: 'tiny muted' }, sub) : null);
}

// ── settings ──────────────────────────────────────────────────────────────────

export function renderSettings(root) {
  const s = State.state.settings;

  const row = (label, desc, control) =>
    h('div', { class: 'card setting-row' },
      h('div', { class: 'set-main' },
        h('div', { class: 'set-label' }, label),
        desc ? h('div', { class: 'tiny muted' }, desc) : null),
      control);

  const select = (value, options, onChange) => {
    const sel = h('select', { class: 'select', onchange: e => onChange(e.target.value) },
      options.map(([v, label]) =>
        h('option', { value: v, ...(v === value ? { selected: '' } : {}) }, label)));
    return sel;
  };

  const toggle = (value, onChange) => {
    const btn = h('button', {
      class: 'toggle' + (value ? ' on' : ''),
      role: 'switch', 'aria-checked': String(value),
      onclick: () => {
        const on = !btn.classList.contains('on');
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-checked', String(on));
        onChange(on);
      },
    }, h('span', { class: 'knob' }));
    return btn;
  };

  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', style: { display: 'none' },
    onchange: async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        State.importJSON(await file.text());
        alert('Progress imported. Welcome back!');
        go('#/');
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    },
  });

  const page = h('div', { class: 'page' },
    topbar('settings'),
    h('h1', {}, 'Settings'),

    row('Volume', 'Output level for all playback.',
      h('input', {
        type: 'range', min: '0', max: '1', step: '0.05', value: String(s.volume), class: 'slider',
        oninput: e => {
          s.volume = Number(e.target.value);
          Audio.setVolume(s.volume);
        },
        onchange: () => { State.save(); Audio.unlock(); Audio.playNote(60, 0.4); },
      })),
    row('Auto-advance', 'Move to the next question automatically after a correct answer.',
      toggle(s.autoAdvance, v => { s.autoAdvance = v; State.save(); })),
    row('Chord playback', 'Arpeggiating after the block chord helps you hear individual notes.',
      select(s.chordStyle, [
        ['block', 'Block chord only'],
        ['block+arp', 'Block, then arpeggio'],
        ['arp', 'Arpeggio only'],
      ], v => { s.chordStyle = v; State.save(); })),
    row('Scale degree labels', 'Movable-do solfege or scale-degree numbers.',
      select(s.degreeLabels, [
        ['solfege', 'Solfege (Do Re Mi)'],
        ['number', 'Numbers (1 2 3)'],
      ], v => { s.degreeLabels = v; State.save(); })),
    row('Melody speed', 'How fast dictation melodies are played.',
      select(String(s.melodyTempo), [
        ['0.7', 'Relaxed'],
        ['0.55', 'Medium'],
        ['0.42', 'Brisk'],
      ], v => { s.melodyTempo = Number(v); State.save(); })),

    h('h2', {}, 'Your data'),
    row('Export progress', 'Download a JSON backup of all progress and settings.',
      h('button', {
        class: 'btn', onclick: () => {
          const blob = new Blob([State.exportJSON()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `earpath-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        },
      }, 'Export')),
    row('Import progress', 'Restore from a backup file. Replaces current progress.',
      h('button', { class: 'btn', onclick: () => fileInput.click() }, 'Import')),
    row('Reset everything', 'Delete all progress and start over. Cannot be undone.',
      h('button', {
        class: 'btn danger', onclick: () => {
          if (confirm('Really delete all progress? This cannot be undone.')) {
            State.resetAll();
            go('#/');
          }
        },
      }, 'Reset')),
    fileInput);

  root.append(page);
  return () => {};
}

// ── guide ─────────────────────────────────────────────────────────────────────

export function renderGuide(root) {
  const songRows = Object.entries(INTERVALS)
    .filter(([, iv]) => iv.songs?.asc || iv.songs?.desc)
    .map(([, iv]) =>
      h('tr', {},
        h('td', {}, h('strong', {}, iv.name)),
        h('td', {}, iv.songs.asc || '—'),
        h('td', {}, iv.songs.desc || '—')));

  const page = h('div', { class: 'page guide' },
    topbar('guide'),
    h('h1', {}, 'How to get better, faster'),
    h('p', {}, 'Ear training is a physical skill, like balance. It responds to ', h('strong', {}, 'short, frequent practice'), ' — five focused minutes a day beats an hour on Sunday. The app is built around that: every level has a small, clear goal, and the questions lean toward whatever you\'ve been missing.'),
    h('div', { class: 'card tipcard' },
      h('h3', {}, '🎤 Sing. Seriously.'),
      h('p', {}, 'The single biggest accelerator. Hum or sing what you hear before you answer — intervals, the notes of a chord, melodies. Connecting your voice to your ear builds the skill twice as fast. Nobody can hear you.')),
    h('div', { class: 'card tipcard' },
      h('h3', {}, '🧭 When you miss, compare.'),
      h('p', {}, 'After a wrong answer, use the “Your pick / Answer” buttons to hear both back-to-back from the same root. The difference between what you thought and what it was is exactly where your ear grows.')),
    h('div', { class: 'card tipcard' },
      h('h3', {}, '🌱 Stuck on a level? That\'s normal.'),
      h('p', {}, 'Plateaus are part of it. Drop back a level for a day to rebuild confidence, or switch modules — skills cross-pollinate. Scale-degree work makes intervals easier, and vice versa.')),

    h('h2', {}, 'Listening strategies by module'),
    MODULES.map(mod =>
      h('div', { class: 'card tipcard', style: { '--mc': `var(--c-${mod.color})` } },
        h('h3', {}, `${mod.icon} ${mod.title}`),
        h('p', {}, mod.tip))),

    h('h2', {}, 'Interval reference songs'),
    h('p', { class: 'muted' }, 'Anchor each interval to a melody you already know. These also appear as hints when you miss an interval.'),
    h('table', { class: 'songs' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Interval'), h('th', {}, 'Ascending'), h('th', {}, 'Descending'))),
      h('tbody', {}, songRows)),

    h('h2', {}, 'About & privacy'),
    h('p', { class: 'muted' },
      'earpath is free, open source, and runs entirely in your browser — no account, no server, your progress lives on your device (use Settings → Export for backups). ',
      h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'Source on GitHub'),
      '. A successor to the earwise project.'),
    h('p', { class: 'muted' },
      'Privacy: the app collects anonymous, cookieless usage statistics (which screens and exercises get used) to guide improvements — never your progress data, never anything personal, and not at all if your browser sends Do Not Track. Feedback you submit through the 💬 button is read by a human.'));

  root.append(page);
  return () => {};
}
