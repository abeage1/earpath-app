// analytics.js — thin wrapper around PostHog. Anonymous, cookieless, and a
// complete no-op when no key is configured or the browser sends Do Not Track.
//
// We track *usage shapes* (which modules people practice, where they stop),
// never personal data. Progress itself stays in localStorage on the device.

import { POSTHOG_KEY, POSTHOG_HOST, APP_VERSION } from './config.js';

let ph = null;        // posthog instance once loaded
let queue = [];       // events captured before the script loads

const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
const enabled = !!POSTHOG_KEY && !dnt
  && !['localhost', '127.0.0.1'].includes(location.hostname);

export function initAnalytics() {
  if (!enabled) return;
  const s = document.createElement('script');
  s.src = `${POSTHOG_HOST.replace('us.i', 'us-assets.i')}/static/array.js`;
  s.async = true;
  s.onload = () => {
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'localStorage',       // no cookies
      autocapture: false,                // explicit events only
      capture_pageview: false,           // hash routing; we send our own
      capture_pageleave: true,
      person_profiles: 'identified_only' // anonymous events: cheaper + private
    });
    ph = window.posthog;
    for (const [event, props] of queue) ph.capture(event, props);
    queue = [];
  };
  document.head.append(s);
}

export function track(event, props = {}) {
  if (!enabled) return;
  const payload = { ...props, app_version: APP_VERSION };
  if (ph) ph.capture(event, payload);
  else queue.push([event, payload]);
}

export const analyticsEnabled = () => enabled;
