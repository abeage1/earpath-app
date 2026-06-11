# Changelog

## 0.2.2 — 2026-06-13

- 📱 The dictation keyboard never scrolls anymore — it always fits your screen (scrolling hid notes and could play keys while panning)

## 0.2.1 — 2026-06-13

First feedback-driven release — thank you r/musictheory! 🙏

- 🐛 **Melodies: every answer note now fits on the keyboard.** Note pools are capped to exactly what each level promises (the upper octave only appears from "Full scale" onward), and the keyboard sizes itself to the range — no more answers hiding off-screen on phones
- ✨ **You now play the given first note/chord yourself.** Everyone's instinct is to start from note 1 — now that's correct. Given items show as ghost hints (and the first melody note is highlighted on the keyboard) instead of being pre-filled
- 🔓 **"Unlock all levels" toggle in Settings** — practice any level in any module, no progression required
- 📖 Each exercise now shows a one-line "how it works" under the prompt

## 0.2.0 — 2026-06-11

The "real people" release. Forked from [earpath](https://github.com/abeage1/earpath) v0.1 to focus on getting the app into users' hands and learning from them.

- 💬 In-app feedback widget (mood + free text), with GitHub-issue and email fallbacks
- 📊 Anonymous, cookieless usage analytics (PostHog; disabled entirely under Do Not Track and on localhost) — see Guide → About & privacy
- 🔗 Social previews (Open Graph / Twitter card) for nicer link sharing
- 📝 Version + changelog link in the footer; privacy note in the Guide
- 🐛 GitHub issue templates for bugs and feedback

## 0.1.0 — 2026-06-09

Initial release: seven modules (pitch, intervals, chords, scales & modes, scale degrees, progressions, melodies), 54 levels, adaptive question selection, confusion tracking, daily workout, streaks, onboarding paths, offline PWA.
