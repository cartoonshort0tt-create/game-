# GameArena — Advanced Platform Blueprint

> Placeholder name: **GameArena**. Swap for your real brand before launch.

A multiplayer competitive gaming platform: many classic games (Chess, Ludo,
Rock-Paper-Scissors, Coin Flip, and more), 1v1 lobbies, a **virtual coin
economy** (no real-money wagering/payouts), animated cartoon-style
presentation, bots for solo play, and a growth path toward ranked leagues,
tournaments, and cosmetics.

This document is the single source of truth for scope, architecture, and
features before any code is written.

---

## 1. Guardrails carried over from scoping (read first)

These constraints came out of an explicit discussion with the project owner
and are **binding design constraints**, not suggestions:

| Original idea | Decision | Why |
|---|---|---|
| Real-money deposits/withdrawals (crypto: USDT, BTC, SOL, TRON, DOGE, SHIB, BNB, ETH) with a 10% platform rake | **Rejected.** Replaced with a virtual coin economy — coins can be *purchased one-way* like game credits, but never cashed out. | Real-money 1v1 wagering with a house cut is legally gambling in virtually every jurisdiction; combined with crypto payouts it also triggers money-transmitter/MSB licensing (FinCEN + state licenses in the US, equivalents elsewhere) and AML/KYC obligations. Building this without a gambling license and a licensed payment processor is a criminal-liability risk, not a ToS issue. |
| Matched strangers turn on webcams for "fair play" | **Dropped.** Replaced with algorithmic anti-cheat + reporting/moderation, and an *optional* opt-in voice/video chat unrelated to fairness or money. | Forcing camera-on between strangers, especially with money at stake and no stated age verification, is a well-known vector for harassment, extortion, and exploitation of minors. |

If real-money wagering is pursued later, it requires: a gambling license in
every operating jurisdiction, a licensed/regulated payment processor, KYC/AML
identity verification, age verification, and dedicated legal counsel — all
outside the scope of this codebase. This blueprint builds the legitimate,
launchable version of the product.

---

## 2. Product Vision

A visually distinctive, cartoon-animated **1v1 game arena**: pick a game,
either get matched with a random opponent or challenge a bot, wager virtual
coins from your wallet, and the winner's coins pool is split (minus a small
"house" cut of virtual coins, which funds tournament prize pools and reward
drops — not real revenue by itself). Real revenue instead comes from
**selling coin packs and cosmetics** (see §12).

Core promise to players: *fast matchmaking, gorgeous game-specific
animations, meaningful progression, and a economy that feels like real
stakes without anyone risking real money.*

---

## 3. Differentiators (what makes this "the most unique platform")

1. **One wallet, many games** — a single coin balance and profile/rank follow
   the player across every game in the arena, not siloed per-game currencies.
2. **Animated "Arena Avatars"** — each player has an animated cartoon avatar
   that reacts live to game events (taunts on a good move, sweat when low on
   time, victory dance, defeat slump). This is the single biggest visual
   differentiator vs. generic game portals.
3. **Universal ranked ladder** — an aggregate "Arena Rating" blends
   performance across all games a player plays, with per-game sub-ratings
   (like a chess.com/osu! hybrid).
4. **Spectator mode + shareable replays** — any finished match can be
   watched back or shared as a link/GIF, big for organic growth.
5. **Bot ladder with personality** — bots aren't just difficulty levels;
   each has a name, avatar, and "play style" (aggressive, defensive,
   chaotic) so solo play still feels alive.
6. **Emote-based social layer** — quick-chat emotes/reactions replace text
   chat and camera; keeps interaction fun without moderation/safety burden
   of open chat or video.
7. **Cross-game tournaments** — a single bracket event where round 1 is
   Rock-Paper-Scissors, round 2 is Coin Flip, finals are Chess — novel event
   format nobody else runs.
8. **Fully offline-capable bot play (PWA)** — install the site as an app,
   play any game vs. bots with zero connection (useful for the "local
   version" phase and for mobile users with spotty data).

---

## 4. Game Library

### Launch lineup (Phase 1)
| Game | Type | Notes |
|---|---|---|
| Rock–Paper–Scissors | Instant, chance+psychology | Best-of-N, simplest to build first — validates the whole lobby/wallet pipeline. |
| Coin Flip (Heads/Tails) | Pure chance | Provably-fair RNG (client seed + server/host seed reveal) so results are verifiably not rigged. |
| Tic-Tac-Toe | Turn-based, skill | Simple state machine, good second game to build. |
| Connect 4 | Turn-based, skill | Slightly deeper strategy, reuses turn-based engine. |
| Chess | Turn-based, deep skill | Needs full rules engine + bot (see §6). Flagship game. |
| Ludo | Turn-based, chance+skill, up to 4p | Extends the platform beyond strict 1v1 into small lobbies. |

### Roadmap additions (Phase 3+)
- Checkers/Draughts, Dice Duel, Battleship, Reaction/Quick-Draw (reflex
  speed test), Memory Match, Word Duel (Wordle-style head-to-head), Snake
  Duel (simultaneous real-time), Air Hockey (physics-based, canvas).

Each game is built as a **self-contained module** behind a shared interface
(see §11) so adding a new game never touches core platform code.

---

## 5. Virtual Economy Design

- **Currency:** "Coins" (single cross-game balance).
- **Acquiring coins:**
  - Free: daily login bonus, first-win-of-the-day bonus, quest/achievement
    rewards, referral bonus.
  - Paid: one-way coin packs (e.g. 500 / 1200 / 3000 coins) — standard
    in-app-purchase style, **no cash-out**, framed like game credits, not
    a financial instrument.
- **Spending coins:**
  - Lobby stakes: player creates a lobby with a coin stake (e.g. 50 coins);
    opponent matches it; winner takes the pool minus house cut (e.g. 10%,
    same feel as originally envisioned, but entirely virtual).
  - Cosmetics: avatar skins, board/piece themes, victory emotes, profile
    frames.
  - Tournament entry fees (coin-denominated prize pools).
- **House cut:** funds a rotating "Jackpot/Prize Pool" for weekly
  tournaments and random reward drops, so it's visibly recirculated to
  players rather than just vanishing — keeps the economy feeling fair and
  engaging without being real money.
- **Anti-abuse:** rate-limit coin faucets per device/account, detect
  collusion (two accounts repeatedly trading coins via lopsided "matches"),
  cap daily free-coin issuance.

---

## 6. Bots (AI opponents)

- Every game ships with at least 3 bot tiers: **Rookie**, **Skilled**,
  **Master**.
- Rock-Paper-Scissors / Coin Flip bots: weighted randomization with slight
  pattern-adaptation for higher tiers (keeps it fair and beatable, not
  frustrating).
- Tic-Tac-Toe / Connect 4: minimax with depth limits per tier (Rookie =
  shallow/random mistakes, Master = near-perfect).
- Chess: integrate **Stockfish compiled to WebAssembly** (`stockfish.wasm`),
  capped by skill level / search depth / configured Elo per bot tier — this
  runs entirely client-side, no server needed.
- Ludo: rule-based heuristic AI (prioritize captures, prioritize safe
  squares, home-run priority) — no need for a heavy search algorithm.
- Bots have a name, avatar, and canned emote reactions to feel alive
  (differentiator #5 above).

---

## 7. Platform Architecture — Phased (critical: GitHub Pages is static-only)

**GitHub Pages only serves static files — it cannot run a server, database,
or WebSocket backend.** This shapes the whole build order:

### Phase 0 — "Local version" (fully static, GitHub Pages ready today)
- Pure HTML/CSS/JS, no build step, no backend.
- All games playable **vs. bots** and **local hotseat** (two people, one
  keyboard/screen — useful for Ludo/Tic-Tac-Toe/RPS).
- Wallet, profile, match history, achievements stored in **`localStorage`**
  (per-browser, not cross-device — clearly a demo/local mode).
- This phase alone satisfies "a local version, GitHub Pages hostable
  website to play the game" from the original request, and is the
  foundation every later phase builds on without a rewrite.

### Phase 1 — Real 1v1 online matchmaking (still no custom server to host)
- Use a **Backend-as-a-Service** so the static frontend stays on GitHub
  Pages while a managed service handles realtime state:
  - **Firebase** (Realtime Database or Firestore + Auth) — generous free
    tier, well-documented, good WebSocket-like realtime sync — *recommended
    default*, or
  - **Supabase** (Postgres + Realtime + Auth) — open-source alternative,
    SQL-based, also has a free tier.
- Matchmaking queue + lobby state lives in Firestore/Supabase; game moves
  are synced the same way (small payloads: "player X played rock", "player
  Y moved e2e4").
- Player accounts move from `localStorage` to Firebase Auth
  (email/anonymous/Google sign-in), wallet balance becomes a Firestore
  document with server-side security rules preventing client-side coin
  tampering.

### Phase 2 — Persistence & fairness hardening
- Server-side (Cloud Functions) validation of match results and coin
  transfers — client never directly writes wallet balances; a function
  verifies the game outcome before crediting coins. This is the standard
  anti-cheat pattern for "client reports a win" systems.
- Provably-fair RNG for Coin Flip/dice: server generates a hashed seed
  before the round, reveals it after, client can verify the hash matches —
  builds trust without needing cameras.

### Phase 3 — Growth features
- Tournaments, leaderboards, cosmetics store, referral system, spectator
  mode, replays.

### Phase 4 (optional, legal-gated, out of scope for this repo)
- Real-money integration, only after gambling licensing + licensed payment
  processor are in place. Not built here.

---

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Rendering | HTML5 Canvas + vanilla JS (Phase 0), evaluate **Phaser 3** if animation complexity grows | No build step needed for launch; Phaser adds sprite/tween/physics helpers if hand-rolled canvas animation becomes limiting for the "advanced animation" goal. |
| Chess engine | `stockfish.wasm` (client-side) | Free, strong, runs in-browser. |
| Styling | Plain CSS + CSS variables for theming (light/dark, seasonal skins) | Keeps Phase 0 dependency-free. |
| State/backend (Phase 1+) | Firebase (Auth + Firestore + Cloud Functions) | Fastest path to realtime multiplayer without hosting a server; free tier covers early growth. |
| PWA | Service worker + manifest.json | Enables offline bot play and "install as app". |
| Hosting | GitHub Pages (frontend) + Firebase (backend services) | Frontend stays free and simple; backend-as-a-service avoids needing a VPS. |

*(Tech stack was left open by the project owner — this table is the
recommended default; Phaser vs. vanilla canvas and Firebase vs. Supabase
are both easy to swap before Phase 1 work starts.)*

---

## 9. Anti-Cheat & Fair Play (replacing the camera idea)

- **Provably-fair RNG** for chance games (hash-commit scheme, see §7 Phase 2).
- **Move-timing heuristics**: flag suspiciously consistent inhuman response
  times (bot-assist detection) for review.
- **Chess engine-assist detection**: compare a player's move accuracy/timing
  against known engine signatures (heuristic, not perfect — same approach
  chess.com/lichess use).
- **Reporting + moderation queue**: any player can report a match; staff/mod
  tools to review replay and suspend accounts.
- **Disconnect/AFK handling**: grace-period timer, auto-forfeit, and coin
  stake protection (disconnector forfeits stake, doesn't just vanish it).

---

## 10. UI/UX & Animation Direction (cartoon/hand-drawn style, as requested)

- **Lobby screen**: grid of game tiles, each with a looping idle animation
  (e.g., chess pieces gently bobbing, RPS hand doing a little wiggle).
- **Avatar system**: cartoon character builder (base body + swappable
  face/hat/outfit layers) — cheap to produce lots of cosmetic variety from
  a small base art set (layered sprite composition, not full redraws).
- **Match intro**: animated "VS" screen with both avatars and their coin
  stake, countdown before game starts.
- **Win/lose sequences**: confetti + avatar victory animation on win;
  avatar slump + "better luck next time" on loss — always end on something
  visually satisfying regardless of outcome.
- **Sound**: light SFX (click, win jingle, coin clink) + optional music
  toggle; no sound required to play (accessibility).
- **Responsive**: mobile-first layout; canvas games scale to viewport.

---

## 11. Data Model (Phase 0 localStorage → Phase 1 Firestore, same shape)

```
Player {
  id, displayName, avatarConfig, createdAt,
  wallet: { coins },
  stats: { arenaRating, perGameRating: { chess: n, ludo: n, ... },
            wins, losses, draws },
  inventory: [cosmeticId, ...],
  achievements: [achievementId, ...]
}

Lobby {
  id, gameType, stake, hostId, guestId | "bot:<botId>",
  status: "waiting" | "active" | "finished",
  state: <game-specific serialized state>,
  createdAt
}

MatchResult {
  id, lobbyId, gameType, players: [id, id], stake,
  winnerId, coinDelta: { [playerId]: +/-n },
  replayLog: [...moves/actions with timestamps],
  finishedAt
}

Transaction {
  id, playerId, type: "purchase" | "stake" | "payout" | "bonus",
  amount, balanceAfter, timestamp
}
```

---

## 12. Repo / File Structure (Phase 0 target)

```
/index.html                 landing + lobby browser
/css/
  base.css, theme.css, animations.css
/js/
  core/
    wallet.js                coin balance, transactions (localStorage-backed)
    profile.js                player profile + avatar config
    matchmaking-local.js      bot/hotseat lobby creation (Phase 0)
    matchmaking-online.js     Firebase-backed queue (Phase 1, added later)
    game-interface.js         shared contract every game module implements
    anti-cheat.js              timing heuristics, provably-fair helpers
  games/
    rps/            rock-paper-scissors engine + bot + render
    coinflip/
    tictactoe/
    connect4/
    chess/          chess rules + stockfish.wasm integration
    ludo/
  ui/
    lobby-browser.js, avatar-builder.js, match-intro.js, results-screen.js
/assets/
  avatars/, boards/, icons/, sfx/, sprites/
/sw.js                       service worker (PWA/offline)
/manifest.json
/BLUEPRINT.md                 this document
/README.md
```

---

## 13. Development Roadmap & Milestones

**Milestone 1 — Skeleton (Phase 0 start)**
Landing page, lobby browser UI, wallet system (localStorage), avatar
builder (basic), one working game end-to-end: Rock-Paper-Scissors vs. bot,
with full win/lose animation and coin stake flow. *This is the smallest
slice that proves the whole architecture.*

**Milestone 2 — Core game library (Phase 0 complete)**
Add Coin Flip, Tic-Tac-Toe, Connect 4. Add local hotseat mode. Add
achievements + daily bonus. PWA/offline support.

**Milestone 3 — Flagship games**
Chess with Stockfish bot integration + full rules engine. Ludo (up to 4
players, bot-fillable).

**Milestone 4 — Go online (Phase 1)**
Firebase integration: accounts, realtime matchmaking queue, cross-device
wallet sync, server-validated match outcomes.

**Milestone 5 — Fairness hardening (Phase 2)**
Provably-fair RNG, move-timing anti-cheat, reporting/moderation tools,
disconnect handling.

**Milestone 6 — Growth (Phase 3)**
Cosmetics store, tournaments, leaderboards, spectator mode, replays,
referral system.

---

## 14. Additional Unique Feature Ideas (growth backlog)

- **Battle Pass / Season Pass** — free + premium reward tracks per season,
  cosmetic-only rewards (no pay-to-win).
- **Clans/Teams** — group players, team leaderboards, clan wars (aggregate
  score across members' matches).
- **Daily Challenges** — "win 3 Connect 4 games", "beat a Master bot at
  Chess" for bonus coins.
- **Prediction/Spectator betting with coins** — spectators wager coins on
  who wins a live match they're watching (still virtual currency only).
- **Custom lobby rules** — time controls for chess, best-of-N for RPS,
  house-rule toggles for Ludo.
- **Replay GIF export/share** — auto-generate a shareable highlight clip of
  the winning move for social sharing (organic growth loop).
- **Global + regional leaderboards**, resetting seasonally.
- **Accessibility modes** — colorblind-safe palettes, reduced-motion toggle,
  full keyboard navigation for board games.
- **Localization-ready text** from day one (i18n string tables), since a
  global competitive platform benefits early from multi-language support.

---

## 15. Monetization (legal-safe version)

- Coin pack purchases (one-way, no cash-out) — primary revenue.
- Cosmetic marketplace (avatar skins, board themes, victory emotes).
- Battle Pass subscription.
- Optional non-intrusive ads on the lobby/results screen for free users
  (removable via a small one-time purchase).

This mirrors how successful skill-game and mobile competitive platforms
(chess.com subscriptions, mobile 1v1 arena games) actually make money
without needing a gambling license.

---

## 16. Open Questions for the Project Owner

1. Confirm the **tech stack** default (vanilla Canvas + Firebase later, as
   recommended) or specify a preference now.
2. Final **brand name** and visual identity (color palette, logo, avatar
   art style reference images if you have any).
3. Priority order for the launch game list — is Rock-Paper-Scissors →
   Coin Flip → Tic-Tac-Toe → Connect 4 → Chess → Ludo the right build
   order, or is there a game you want first for a demo?
4. Any specific regions/languages to prioritize for localization?

---

*Next step: build Milestone 1 (landing page + lobby + wallet + Rock-Paper-
Scissors vs. bot) as the first working slice of this blueprint.*
