# earpath launch plan

Goal for month 1: **get ~200–500 real humans to try it, and 20+ pieces of written feedback.**
Strategy: free/organic channels first (this is a niche where organic works), spend money only on a domain. Hold the rest of the budget until analytics shows people *returning* — paid traffic into a leaky product is wasted.

## Sequencing

1. **Week 0 (before posting anywhere):** domain live ✅, analytics live, feedback widget live. Soft-test with 2–3 friends/musicians; fix anything embarrassing.
2. **Week 1 — friendly niche communities** (low stakes, high-quality feedback):
   - r/musictheory "weekly How do I learn X?" thread + standalone post if mods allow tools
   - r/WeAreTheMusicMakers (check self-promo rules: Feedback Friday / 9:1 rule)
   - r/SideProject, r/InternetIsBeautiful (tool posts welcome)
   - Music-learning Discords (Andrew Huang's server, music theory servers) — share in #resources channels
3. **Week 2 — Show HN.** HN loves free, no-account, no-backend tools with honest write-ups. Best window: weekday morning US Eastern. Engage in comments all day.
4. **Week 3–4 — Product Hunt + instrument-specific subs** (r/piano, r/Guitar, r/singing, r/Bass — frame each post around that instrument's use case). Apply what week 1–2 feedback taught us first.

## Rules of engagement (important)

- Read each subreddit's self-promotion rules before posting; some require participation history. Post as yourself, disclose you built it, never astroturf.
- Reply to every comment, even critical ones — comments are the feedback channel.
- After each post, log traffic + feedback in `marketing/log.md` so we learn which channels work.

## Budget (of $150)

| Item | Cost |
|---|---|
| earpath.app domain (Cloudflare/Porkbun, at-cost) | ~$14/yr |
| PostHog analytics (free tier, 1M events/mo) | $0 |
| Hosting (GitHub Pages) | $0 |
| Reserve: small Reddit-ads experiment **only if** week-1–4 organic shows D7 retention | up to $100, hold for now |

## Success metrics (PostHog)

- Visitors → `app_open` count
- Activation: % of new visitors who answer ≥5 questions (`question_answered`)
- Aha moment: % reaching first `level_complete`
- Retention: `app_open` with `total_answers > 0` on a later day
- Feedback volume: `feedback` events + GitHub issues
