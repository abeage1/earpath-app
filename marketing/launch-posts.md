# Ready-to-post launch drafts

Post as yourself; these are written in your voice as the project owner. Feel free to edit — authenticity beats polish on every one of these platforms.

---

## Show HN (Hacker News)

**Title:** Show HN: Earpath – ear training from "is this note higher?" to chord dictation

**Text:**

I built a free ear training app that runs entirely in the browser — no account, no backend, no build step even. Synthesized audio via Web Audio, progress in localStorage, deployable as a static site.

The thing I tried to get right is the difficulty curve. Most ear training tools either dump all twelve intervals on you at once (brutal for beginners) or stop at basic intervals (useless for advancing musicians). Earpath is structured as seven skill ladders — pitch direction, intervals, chords, scales/modes, scale degrees, chord progressions, melodic dictation — each made of small levels with a transparent goal: "get 10 of your last 12 right." An onboarding step lets experienced ears skip ahead.

Some details that were fun to build:

- Question selection is weighted toward your weak skills (each interval × direction is tracked separately)
- When you miss, you can hear your answer and the correct one back-to-back from the same root — plus a reference-song mnemonic ("Perfect 5th ascending: think Star Wars")
- Functional training (scale degrees, progressions) always establishes the key with a cadence first, so you learn tonal context rather than pitch tricks
- A confusion matrix on the stats page tells you which pairs you mix up most
- Chord progressions are voice-led (closest-inversion voicing + bass note) so they sound like music, not parallel block triads

It's young and I'm actively collecting feedback — there's a feedback button in the app, or tell me here what's broken or missing. Source: https://github.com/abeage1/earpath-app

---

## r/musictheory

**Title:** I built a free, no-signup ear training site that goes from absolute beginner to modes/dictation — looking for feedback from people who actually teach/learn this

**Text:**

After bouncing off existing ear training tools (either overwhelming on day one, or too shallow after a month), I built my own and I'd genuinely like this community's critique.

Design choices I'd love opinions on:

- Skills are split into 7 tracks (pitch → intervals → chords → scales/modes → scale degrees → progressions → melodic dictation), each a ladder of tiny levels with an explicit goal ("10 of your last 12 right")
- Scale degree and progression training always establishes the key with a I–IV–V–I cadence first
- Interval misses show reference-song mnemonics; chord/scale misses let you A/B your answer vs. the correct one from the same root
- Movable-do solfege by default (numbers available in settings)

It's free, open source, no account, works offline: https://earpath.app

What's wrong with the pedagogy? What would you add or reorder? I'll be in the comments.

---

## r/WeAreTheMusicMakers

**Title:** I made a free ear training web app that doesn't drown beginners or bore experienced ears — would love your feedback

**Text:**

Free, no signup, works on your phone: https://earpath.app

You pick a starting point (brand new / know some basics / experienced), and it gives you small, clearly-scoped levels across intervals, chords, scales, scale degrees, progressions, and melodic dictation. It tracks which sounds you confuse with which (turns out I can't tell major 6ths from perfect 5ths to save my life) and feeds you more of what you're weak at.

Built it because a few minutes of daily ear training genuinely transferred to my playing faster than anything else I've practiced, and I wanted a tool that made the daily part frictionless.

It's new — tell me what's broken, confusing, or missing and I'll fix it.

---

## r/SideProject

**Title:** earpath — a free ear training PWA (vanilla JS, no backend, Web Audio synthesis) that adapts to your weak spots

**Text:**

Stack: zero. No framework, no build step, no server. Vanilla ES modules + Web Audio API synthesis, localStorage for progress, GitHub Pages for hosting. ~5k lines.

Product idea: ear training has a brutal cold-start problem (beginners get 12 intervals dumped on them) and a boredom problem (most tools cap out at basics). earpath is 7 skill ladders × ~8 small levels each, with adaptive question selection, confusion tracking, and a daily mixed workout.

Try it: https://earpath.app · Source: https://github.com/abeage1/earpath-app

Honest feedback wanted — especially on the first 5 minutes of using it.

---

## r/InternetIsBeautiful

**Title:** A free site that teaches you to recognize intervals, chords and melodies by ear — no account, works offline

*(link post — no text needed; be ready to answer comments)*

---

## Product Hunt

**Name:** earpath
**Tagline:** Ear training that meets you where you are
**Description (260 chars):**
Free, open-source ear training in your browser. Seven skill ladders from "is this note higher?" to chord progressions & melodic dictation. Adaptive questions, confusion tracking, daily workouts. No account, no ads, works offline.

**First comment (maker):**
Hi PH! I built earpath because every ear training tool I tried either overwhelmed me on day one or stopped being useful after a month. The core idea: tiny levels with transparent goals, an onboarding that lets you skip ahead honestly, and question selection that targets whatever you personally confuse. It's free and open source — there's a 💬 button in the app and every note gets read. What should I build next?

---

## Instrument-specific variants (week 3–4)

**r/piano:** lead with melodic dictation + the on-screen piano: "I built a free dictation trainer — it plays a melody, you play it back."
**r/Guitar:** lead with intervals/chords: "Free tool to finally learn to name chords and intervals by ear."
**r/singing:** lead with pitch + scale degrees: "Free tool that trains you to hear where a note sits in the key — the skill behind singing in tune."
