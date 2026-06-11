// feedback.js — floating feedback button + modal.
//
// Submissions go to PostHog as a `feedback` event when analytics is
// configured; otherwise (and as a always-available fallback) users get
// one-click GitHub-issue and email paths.

import { h } from './ui.js';
import { track, analyticsEnabled } from './analytics.js';
import { REPO_URL, FEEDBACK_EMAIL, APP_VERSION } from './config.js';

let fab = null;

export function mountFeedback() {
  fab = h('button', {
    class: 'feedback-fab',
    'aria-label': 'Send feedback',
    onclick: openModal,
  }, '💬', h('span', { class: 'fab-label' }, 'Feedback'));
  document.body.append(fab);
}

export function setFeedbackVisible(visible) {
  if (fab) fab.classList.toggle('hidden', !visible);
}

function openModal() {
  let rating = null;

  const textarea = h('textarea', {
    class: 'fb-text',
    rows: '4',
    placeholder: 'What’s working? What’s confusing? What’s missing?',
  });
  const email = h('input', {
    class: 'fb-email',
    type: 'email',
    placeholder: 'Email (optional — only if you’d like a reply)',
  });
  const status = h('div', { class: 'fb-status' });

  const moods = [['😞', 'rough'], ['😐', 'okay'], ['😄', 'great']].map(([emoji, val]) =>
    h('button', {
      class: 'mood',
      'aria-label': val,
      onclick: e => {
        rating = val;
        overlay.querySelectorAll('.mood').forEach(b => b.classList.remove('on'));
        e.currentTarget.classList.add('on');
      },
    }, emoji));

  const issueUrl = () =>
    `${REPO_URL}/issues/new?title=${encodeURIComponent('Feedback')}` +
    `&body=${encodeURIComponent(`${textarea.value}\n\n—\napp version: ${APP_VERSION}`)}`;
  const mailUrl = () =>
    `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('earpath feedback')}` +
    `&body=${encodeURIComponent(textarea.value)}`;

  function send() {
    const text = textarea.value.trim();
    if (!text && !rating) {
      status.textContent = 'Pick a mood or write a note first.';
      return;
    }
    if (analyticsEnabled()) {
      track('feedback', { rating, text, email: email.value.trim() || undefined });
      panel.innerHTML = '';
      panel.append(
        h('div', { class: 'fb-thanks' }, '🙏'),
        h('h2', {}, 'Thank you!'),
        h('p', { class: 'muted' }, 'Every note gets read and shapes what gets built next.'),
        h('button', { class: 'btn primary', onclick: () => overlay.remove() }, 'Close'));
    } else {
      // No analytics configured — hand off to GitHub with the text prefilled.
      window.open(issueUrl(), '_blank', 'noopener');
      overlay.remove();
    }
  }

  const panel = h('div', { class: 'feedback-modal' },
    h('button', { class: 'fb-close', 'aria-label': 'Close', onclick: () => overlay.remove() }, '✕'),
    h('h2', {}, 'Help shape earpath'),
    h('p', { class: 'muted tiny' }, 'earpath is young — honest feedback is the most valuable thing you can give it.'),
    h('div', { class: 'moods' }, moods),
    textarea,
    email,
    status,
    h('div', { class: 'fb-send-row' },
      h('button', { class: 'btn primary', onclick: send }, 'Send')),
    h('div', { class: 'fb-alt' },
      'Prefer ',
      h('a', { href: issueUrl(), target: '_blank', rel: 'noopener',
               onclick: e => { e.currentTarget.href = issueUrl(); } }, 'GitHub'),
      ' or ',
      h('a', { href: mailUrl(), onclick: e => { e.currentTarget.href = mailUrl(); } }, 'email'),
      '?'));

  const overlay = h('div', {
    class: 'overlay',
    onclick: e => { if (e.target === overlay) overlay.remove(); },
  }, panel);
  document.body.append(overlay);
  textarea.focus();
}
