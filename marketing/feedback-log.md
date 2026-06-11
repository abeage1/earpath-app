# Feedback log

Every piece of user feedback, verbatim where possible. Themes get tallied; a theme with 2–3 independent mentions graduates to the roadmap. Bugs skip the queue and get fixed immediately.

Sources: 💬 = in-app widget (PostHog `feedback` events) · R = Reddit · GH = GitHub issue · DM = direct message/chat · HN = Hacker News

## Themes (running tally)

| Theme | Votes | Status |
|---|---|---|
| Show notes on a staff (notation display) | 1 | Collecting — was already on v0.1 roadmap (VexFlow); one more independent mention → schedule |
| Unlock all levels / don't gate practice | 2 (commenter + owner) | ✅ Shipped v0.2.1 — "Unlock all levels" toggle in Settings |
| Unclear what to do in some exercises | 1 | ✅ Mitigated v0.2.1 — per-exercise how-to line under the prompt |
| Melody: answer note not on (visible) keyboard | 1 (bug) | ✅ Fixed v0.2.1 — note pool capped to level range, keyboard sized to fit |
| Melody/progressions: want to play the given first note/chord, not have it pre-filled | 2 (commenter + owner) | ✅ Fixed v0.2.1 — given items are now ghost hints you perform yourself |

## Raw log

### 2026-06-13 · DM (Reddit chat)
> Asked if notes could be shown on a staff.

Theme: staff notation. Context unknown (which exercise) — worth asking follow-up: melodies/dictation, or everywhere?

### 2026-06-13 · R (r/musictheory thread, reddit.com/r/musictheory/comments/1u2y87u)

**anonymous commenter 1** (intervals user, positive, will share):
> i'd put a button somewhere to unlock every level, there's no need to gatekeep any kind of training or knowledge behind progression, if i want to train for a specific interval, just let me do it!

Theme: unlock-all. Owner agreed ("was craving that feature myself"). → 2 votes.

**u/etzpcm** (positive, bookmarked):
> Took me a little while at first to figure out what I was expected to do for some of the exercises.

Theme: exercise instructions unclear. Confusion → fix-now category.

**u/basheltarence**:
> I tried the melody section and the first example i was given didn't have the second note available on the keyboard. I also would prefer if i was able to click the first note of the melody and not have it be counted as incorrect.

Two items: (1) BUG — melody pool silently included upper-octave Do on every level; on phones the keyboard scrolls horizontally with no affordance, so far-right notes were effectively invisible/unavailable. (2) UX — pre-filled "given" first note/chord is counterintuitive; owner independently hit the same thing in melodies AND progressions ("I kept starting with the first note... instead of the 2nd").
