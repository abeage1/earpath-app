// piano.js — clickable on-screen keyboard used for melodic dictation.

import { h } from './ui.js';
import * as Audio from './audio.js';
import { midiName } from './theory.js';

const isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

// Renders a keyboard covering [lo, hi] (expanded to white-key edges) into
// `container`. Returns { highlight, flash, clear, setEnabled, root }.
export function createPiano(container, lo, hi, { onKey, tonic } = {}) {
  while (isBlack(lo)) lo--;
  while (isBlack(hi)) hi++;

  const whites = [];
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const W = 100 / whites.length;

  const root = h('div', { class: 'piano', role: 'group', 'aria-label': 'Piano keyboard' });
  const keyEls = {};
  let enabled = true;

  const press = midi => {
    if (!enabled) return;
    Audio.unlock();
    Audio.playNote(midi, 0.7);
    const el = keyEls[midi];
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 180);
    onKey?.(midi);
  };

  whites.forEach((m, i) => {
    const key = h('button', {
      class: 'pkey white' + (tonic !== undefined && m % 12 === tonic % 12 ? ' tonic' : ''),
      style: { left: `${i * W}%`, width: `${W}%` },
      'aria-label': midiName(m),
      onpointerdown: e => { e.preventDefault(); press(m); },
    });
    if (tonic !== undefined && m % 12 === tonic % 12) {
      key.append(h('span', { class: 'tonic-dot' }));
    }
    keyEls[m] = key;
    root.append(key);
  });

  for (let m = lo; m <= hi; m++) {
    if (!isBlack(m)) continue;
    // Position over the boundary after the previous white key.
    const prevWhiteIdx = whites.findIndex(w => w > m) - 1;
    const key = h('button', {
      class: 'pkey black',
      style: { left: `${(prevWhiteIdx + 1) * W - W * 0.30}%`, width: `${W * 0.60}%` },
      'aria-label': midiName(m),
      onpointerdown: e => { e.preventDefault(); press(m); },
    });
    keyEls[m] = key;
    root.append(key);
  }

  container.append(root);

  return {
    root,
    setEnabled(v) { enabled = v; root.classList.toggle('disabled', !v); },
    highlight(midi, cls = 'hl') { keyEls[midi]?.classList.add(cls); },
    flash(midi, cls = 'hl', ms = 450) {
      const el = keyEls[midi];
      if (!el) return;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    },
    clear() {
      Object.values(keyEls).forEach(el => el.classList.remove('hl', 'hl-good', 'hl-bad'));
    },
  };
}
