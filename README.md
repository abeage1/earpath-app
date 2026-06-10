# earpath — ear training, one step at a time

**[▶ Live app →](https://abeage1.github.io/earpath/)**

A free, open-source ear training app that meets you where you are — from "is the second note higher or lower?" all the way to ninth chords, modes, chromatic scale degrees and melodic dictation. Pure static HTML/CSS/JS: no backend, no build step, no account. All audio is synthesized in the browser with the Web Audio API, and all progress lives in your browser's localStorage.

## The idea

Most ear training tools dump every interval and chord on you at once, which is the fastest way to discourage a beginner — or they cap out at basics, which bores an advancing musician. earpath is built around a single design question: **at every skill level, what is the one next thing this person can learn without being overwhelmed?**

The answer is a curriculum of seven modules, each a ladder of small levels with one plainly stated goal ("get 10 of your last 12 right"). Levels unlock in a pedagogically informed order, an onboarding step lets experienced ears skip ahead, and nothing ever re-locks.

## Modules

| Module | What it trains | Range |
|---|---|---|
| **Pitch** | Higher / lower / same | Octave leaps → single semitones |
| **Intervals** | Naming the distance between two notes | Octave vs 5th → all 12, up/down/harmonic → compound |
| **Chords** | Chord quality | Major vs minor → 7ths, sus, inversions, 6ths, 9ths |
| **Scales & Modes** | Scale color | Major vs minor → all modes → whole-tone, diminished, Phrygian dominant |
| **Scale Degrees** | Functional hearing: where a note sits in a key (after a cadence) | Do–Mi–Sol → full diatonic → minor key → chromatic |
| **Progressions** | Roman-numeral identification of chord progressions in a key | I–IV–V → diatonic pop progressions → minor key → 5-chord lines |
| **Melodies** | Melodic dictation: play back what you hear on an on-screen piano | 3 stepwise notes → 7 notes with leaps and chromatic touches |

## Features

- **Adaptive question selection** — every skill (each interval × direction, each chord type, each scale degree…) is tracked individually; questions are weighted toward what you've been missing and what's newly introduced
- **Transparent goals** — every level says exactly what it takes to complete it; a progress ring fills as you get there
- **Onboarding placement** — choose *brand new* / *know some basics* / *experienced* and start at an appropriate depth in every module
- **Compare on a miss** — after a wrong answer, hear your pick and the correct answer back-to-back from the same root; intervals also show a reference-song mnemonic ("Perfect 5th ascending · think *Star Wars*")
- **Functional training done right** — scale degrees and progressions are always preceded by a key-establishing cadence, so you learn tonal context rather than pitch-matching tricks
- **Confusion tracking** — the stats page shows which pairs you mix up most ("Major 6th heard as Perfect 5th × 7") with side-by-side playback for each
- **Daily workout** — a 15-question mixed session drawn from your current level in every module you've started
- **Streaks & activity** — daily streak and a 12-week practice heatmap
- **Keyboard-first** — `1–9` answer, `R` replay, `Enter` next, `Backspace` undo
- **Offline-capable PWA** — works with no connection after first load
- **Own your data** — export/import progress as JSON

## Running locally

ES modules require an HTTP server (not `file://`):

```
npx serve .
```

or any static file server, then open the printed URL.

## Deployment

It's a static site — host the repo root anywhere (GitHub Pages, Netlify, Cloudflare Pages…). No build step.

## Architecture

```
index.html
css/style.css        theming + all components
js/theory.js         intervals, chords, scales, degrees, numerals, reference songs
js/curriculum.js     modules, levels, unlock rules, onboarding paths
js/audio.js          Web Audio synth + sequencing (intervals/chords/scales/cadences/melodies)
js/engine.js         question generation & grading for every module
js/state.js          localStorage persistence, per-skill stats, streaks, confusions
js/session.js        the practice screen (choice / sequence / dictation UIs)
js/views.js          home, module pages, stats, settings, guide, onboarding
js/piano.js          clickable on-screen keyboard
js/ui.js             tiny DOM helpers
sw.js                offline cache
```

## Pedagogy notes

- Interval unlock order (P8+P5 → P4 → seconds → thirds → tritone → sixths → sevenths) starts with the most acoustically distinctive intervals and adds maximally confusable pairs together so you learn the contrast directly.
- Ascending intervals come before descending before harmonic, per standard aural-skills sequencing.
- Chords begin with the major/minor contrast, the single most fundamental distinction in Western harmony, before adding tension qualities (dim, aug) and four-note chords.
- Scale-degree training uses movable-do solfege (or numbers — your choice) and is the backbone of *functional* hearing: recognizing what a note *does* in a key, which transfers to real music far better than isolated interval naming.
- Melodic dictation generation is biased toward stepwise motion (like real melodies) with leap-heavy and chromatic variants at higher levels.

## Roadmap

- [ ] Rhythm & meter module
- [ ] Secondary dominants and borrowed chords in progressions
- [ ] Staff-notation display of answers (VexFlow)
- [ ] Sampled instrument timbres (piano/guitar/strings) as a setting
- [ ] Per-skill spaced-repetition review queue

## Credits

Successor to [earwise](https://github.com/abeage1/earwise). MIT licensed.
