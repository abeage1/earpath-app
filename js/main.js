// main.js — bootstrapping and hash routing.

import * as State from './state.js';
import * as Audio from './audio.js';
import { renderHome, renderModule, renderStats, renderSettings, renderGuide } from './views.js';
import { renderPractice, renderDaily } from './session.js';

const app = document.getElementById('app');
let cleanup = null;

function route() {
  if (cleanup) { try { cleanup(); } catch { /* view already gone */ } cleanup = null; }
  app.innerHTML = '';
  window.scrollTo(0, 0);

  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [view, a, b] = parts;

  if (!view) cleanup = renderHome(app);
  else if (view === 'module' && a) cleanup = renderModule(app, a);
  else if (view === 'practice' && a !== undefined && b !== undefined) {
    cleanup = renderPractice(app, a, Number(b));
  }
  else if (view === 'daily') cleanup = renderDaily(app);
  else if (view === 'stats') cleanup = renderStats(app);
  else if (view === 'settings') cleanup = renderSettings(app);
  else if (view === 'guide') cleanup = renderGuide(app);
  else cleanup = renderHome(app);
}

State.load();
Audio.setVolume(State.state.settings.volume);

window.addEventListener('hashchange', route);
route();

// Offline support (no-op during local file:// development).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
