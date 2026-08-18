# The Ruthven Cup - Website Design

Status: Approved in conversation with Simon, 2026-08-10 (visual direction, year page layout,
tech choice, and data model each signed off individually; Rules page content supplied by Simon).

## What it is

A static website for the Ruthven family's annual golf tournament. It records five-plus years of
history: the venue each year, who played, who won, and (from 2025 onward) full scorecards. It is
also the home of the official competition rules.

Two prizes, one round, contested annually:

- **The Tankard** - awarded to the Ruthven family player with the highest Stableford score over
  18 holes. Engraved each year.
- **The Phallus Trophy** - "the best of the rest": the invited guest with the highest Stableford
  score.
- **No handicaps.** Gross Stableford only.
- **Tie-break**: a three-hole putt-off on the practice green with the midget putter. The data
  model must be able to record that a winner was decided this way.

Family motto: **"Deid schaw"** (deeds show).

## How it is maintained

Simon updates the site once a year by editing files in the repo and pushing. There is no backend,
no database, no CMS, and no in-browser upload. GitHub Pages serves the built site for free.

## Technology

- **Astro** (static site builder). At build time it reads the data files, computes Stableford
  points, and emits plain HTML. Adding a year = drop in a JSON file, a CSV, and photos, then push.
- **GitHub Actions** builds and deploys to **GitHub Pages** on push.
- Animation is CSS plus small amounts of vanilla JavaScript. No frontend framework.

## Data model

All content lives in `data/` and `photos/` as hand-editable files.

### `data/years/<year>.json` - one per year

- venue display name, date, location
- Tankard winner, Phallus Trophy winner (winner name + optional winning points + optional
  `decidedByPuttOff: true`)
- list of participant names (keys into player files)
- optional pointer to a scores CSV and a course file
- optional group photo filename

Past years (2021-2024) have only venue, winners, and family participants. Pages must render
gracefully when scores, photos, or participant details are missing.

### `data/years/<year>-scores.csv` - one per year, optional

One row per player: `name, h1..h18` gross strokes. Blank cell = picked up (no score, zero points).
Optional extra columns accepted:

- `points` - pre-computed total Stableford points, used as-is when present (lets Simon transcribe
  a card total without hole detail)
- `hcp` - handicap, in case a future year reintroduces them; defaults to 0

### `data/courses/<slug>.json` - one per venue, optional

Par per hole (required for computing points from strokes), stroke index per hole (optional,
only used if handicaps ever return), venue display name.

### `data/players/<slug>.json` + `photos/players/<slug>.jpg`

Bio text, family or guest flag, first year played, optional headshot. A player named in any year's
participant list must have a player file (build fails otherwise). Missing headshot renders as a
styled monogram placeholder.

### `photos/years/<year>-group.jpg`

The group photo, displayed on that year's page.

### Scoring rules (build-time module)

- Stableford points per hole from gross strokes vs par: 2 points for par, 1 for bogey, 3 for
  birdie, etc.; blank hole = 0 points.
- If a `points` column exists for a row, it wins over computation.
- Handicap, when present and non-zero, allocates strokes by stroke index (standard allowance);
  when absent, gross scoring.
- Ties share a leaderboard position; a recorded putt-off marks the winner.
- This module is the only real logic in the site and is unit tested.

## Pages

1. **Home** - the approved "heritage wow" design: full-screen hero with the family crest (the
   goat-and-clubs logo) above the title, the motto, staggered type entrance and gold shimmer; scrolling marquee of motto and facts; honours
   board (giant outlined year numerals, winner,  generated from year files); count-up stats
   band; player grid preview; side-by-side Tankard and Phallus Trophy panels; tartan trim bands.
2. **Year page** (`/2025/` etc.) - the approved layout: year switcher across the top; venue and
   date as the headline with both winners alongside; full-width group photo; leaderboard with
   Stableford/strokes toggle and family/guest chips; clicking a player row unfolds their 18-hole
   card (gold for birdie or better, faded for picked-up holes). Sparse years show header, winners,
   and photo only - no table.
3. **Players** (`/players/`) - grid of everyone who has ever played, headshot tiles with hover
   zoom, champions starred.
4. **Player bio** (`/players/<slug>/`) - headshot, bio, years played, wins, best round.
5. **Rules** (`/rules/`) - the official competition rules, verbatim as supplied by Simon
   (emoji included - the tone is the content), styled as an engraved charter: numbered clauses
   in large serif, gold dividers, the Golden Rule (rule 15) given closing prominence. One
   exception to verbatim: the title's "2026" is dropped so the page never goes stale.

The year switcher, honours board, and stats are all generated from whichever year files exist.
Adding 2026 requires no template changes.

## Design system

- **Look**: the approved heritage direction - old, grand, but modern. Restraint and typographic
  scale rather than ornament.
- **Type**: Fraunces (display serif, light weights, italic accents) + Archivo (small uppercase
  labels with wide letter-spacing). Self-hosted font files, not Google-served, so the site works
  offline and loads fast.
- **Palette**: deep green (#0a1f15 ground), gold (#c9a65a / #e8cd8a), claret red (#8c2632) as an
  accent, parchment ink (#f2ecdc). Matches the family cloth (green, gold, red).
- **Tartan**: thin woven trim bands (CSS gradients) at page top and footer. Built as one swappable
  component so a photo strip of the real cloth replaces it later with a one-line change.
- **Crest**: the goat-and-clubs logo is the site mark. It sits above the title in the hero and
  as a small mark in the nav (replacing the text-only wordmark) and footer. Until Simon supplies
  the file, a placeholder holds its spot like the other images.
- **Placeholders**: crest, tankard photo, trophy photo, and cloth are dashed-border placeholder
  blocks wired so dropping in real images is a one-line change each. The tankard photo lives in
  the Tankard panel of the trophies section (and can headline the honours board), not the hero -
  the crest owns the hero.
- **Animation**: hero entrance choreography (staggered line rise, shimmer on the italic word),
  scroll-triggered fade-up reveals, count-up stats, marquee, hover states (honours years fill
  gold, player tiles Ken Burns zoom). All respect `prefers-reduced-motion`.

## Edge cases

- Year without scores: winners and photo only, no leaderboard.
- Player without headshot: monogram placeholder in site style.
- Malformed or inconsistent CSV (wrong column count, unknown player, non-numeric strokes): the
  build fails with a clear message. A bad file can never silently publish wrong scores.
- Player in a year list without a player file: build fails with a clear message.
- Ties: shared position; putt-off flag marks the winner.

## Testing

- Unit tests for the Stableford calculator: points from strokes, blanks, pre-computed points
  column override, handicap allocation (for the optional path), tie handling.
- Build-time validation tests: CSV shape, participant/player-file cross-check.
- No browser/E2E tests - the output is static HTML and visual review covers it.

## Out of scope (deliberate)

- No CMS, login, or in-browser CSV upload. Simon edits files. If family members ever need to
  upload scores themselves, that is a separate future project (would need a backend or Google
  Sheets as a data source).
- No photo galleries beyond the group photo per year, no venues map, no records/stats page,
  no head-to-head - all listed as possible future pages, none requested now.
- No handicap UI. The data path exists but nothing surfaces it.

## Open questions

None blocking. Real photos (tankard, trophy, cloth, headshots, group photos) and the historical
winners/venues list arrive later; placeholders and sample data stand in until then.
