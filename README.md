# GameArena (working title)

A multiplayer competitive gaming platform — 1v1 arenas for Chess, Ludo,
Rock-Paper-Scissors, Coin Flip, and more, with a virtual coin economy,
bot opponents, and cartoon-animated presentation. Built to be hostable
as a static site on GitHub Pages.

**Status:** Full game library live — Rock-Paper-Scissors, Coin Flip,
Tic-Tac-Toe, Connect 4, Chess (full standard rules), and Ludo are all
playable vs. tiered bots, on top of the wallet, avatar profile, and
lobby system, entirely as a static site with no backend.

See [`BLUEPRINT.md`](./BLUEPRINT.md) for the full advanced blueprint:
product vision, game library, virtual economy design, architecture
phases, tech stack, data model, repo structure, and the development
roadmap.

## Run it locally

No build step or dependencies. From the repo root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. (Opening `index.html`
directly by double-clicking also works, since there are no ES modules —
just plain scripts.)

## Host it on GitHub Pages

Repo Settings → Pages → Deploy from branch → pick this branch (or `main`)
and the `/ (root)` folder. The site is 100% static (HTML/CSS/vanilla JS,
localStorage for the wallet/profile), so no further setup is needed.

## Why no real-money wagering or camera matching?

Those were in the original concept but were dropped after a scoping
discussion — real-money 1v1 wagering with a platform cut is gambling in
virtually every jurisdiction (requires licensing + money-transmitter
registration for crypto payouts), and matching strangers on webcam tied
to money is a safety risk. `BLUEPRINT.md` §1 covers the reasoning and the
virtual-currency alternative that replaces it. Real-money features can be
revisited later with proper legal/licensing groundwork — that's outside
this repo's scope.

## Next step

Milestone 4+ from the blueprint: real online 1v1 matchmaking (Firebase),
cross-device accounts, cosmetics store, tournaments, leaderboards, and
offline/PWA support.
