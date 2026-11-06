# earpath launch plan

Goal for month 1: **get ~200–500 real humans to try it, and 20+ pieces of written feedback.**
Strategy: free/organic channels first (this is a niche where organic works), spend money only on a domain. Hold the rest of the budget until analytics shows people *returning* — paid traffic into a leaky product is wasted.

## Sequencing

1. **Week 0 (before posting anywhere):** domain live ✅, analytics live, feedback widget live. Soft-test with 2–3 friends/musicians; fix anything embarrassing.
2. **Week 1 — Show HN + Discords** (no karma gating):
   - Show HN: free, no-account, no-backend tools with honest write-ups do well. Weekday morning US Eastern; engage in comments all day.
   - Music-learning Discords (Andrew Huang's server, music theory servers) — share in #resources channels
   - Classic music forums: Piano World, TalkBass, VI-Control, Ultimate Guitar — old-school but full of exactly our users
   - In parallel: run the Reddit warm-up below.
3. **Week 2–3 — Reddit** (after warm-up): r/musictheory (or its weekly thread), r/WeAreTheMusicMakers (Feedback Friday / promo threads), r/SideProject, r/InternetIsBeautiful.
4. **Week 3–4 — Product Hunt + instrument-specific subs** (r/piano, r/Guitar, r/singing, r/Bass — frame each post around that instrument's use case). Apply early feedback first.

## Reddit cold-account playbook (learned 2026-06-11: first post insta-filtered)

Reddit's spam filter removes link posts from low-karma accounts pointing at new domains. The post content doesn't matter. Recovery:

1. **Don't delete-and-repost, and don't post the same link to other subs the same day.** Repeated filtered submissions can get the *domain* sitewide-blacklisted — much worse than one removed post.
2. **Modmail the sub** ("Message the mods" on the sub's sidebar) asking them to review/approve the filtered post. Mod approval also trains the filter on the domain. Draft in `launch-posts.md`.
3. **Warm the account for ~1–2 weeks**: genuinely answer questions in r/musictheory, r/piano, r/WeAreTheMusicMakers (ear-training questions come up constantly — answer them well, no links). ~100 comment karma clears most automod thresholds. This is also free audience research.
4. **Use designated threads** which are exempt from self-promo filtering: r/musictheory weekly questions/resources thread, r/WeAreTheMusicMakers promo/feedback threads.
5. When posting standalone again, the account has history, the domain has been approved once, and mods recognize you — pass rates go way up.

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
