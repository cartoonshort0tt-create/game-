# GameArena (working title)

A multiplayer competitive gaming platform — 1v1 arenas for Chess, Ludo,
Rock-Paper-Scissors, Coin Flip, and more, with a virtual coin economy,
bot opponents, and cartoon-animated presentation. Built to be hostable
as a static site on GitHub Pages.

**Status:** Planning complete, implementation not started yet.

See [`BLUEPRINT.md`](./BLUEPRINT.md) for the full advanced blueprint:
product vision, game library, virtual economy design, architecture
phases, tech stack, data model, repo structure, and the development
roadmap.

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

Build Milestone 1 from the blueprint: landing page + lobby browser +
wallet system + Rock-Paper-Scissors vs. bot, fully playable as a static
site with no backend.
