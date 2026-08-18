# The Ruthven Cup

Static website for the annual Ruthven family golf tournament. Built with
[Astro](https://astro.build), deployed to GitHub Pages. *"Deid schaw."*

## Commands

```bash
npm install      # once
npm run dev      # local dev server
npm test         # scoring + validation tests
npm run build    # production build to dist/
```

## Adding a year (the annual job)

1. Create `data/years/2026.json`:

   ```json
   {
     "year": 2026,
     "venue": "Course Name",
     "location": "Perthshire",
     "date": "2026-06-13",
     "course": "course-slug",
     "participants": ["angus-ruthven", "new-guest"],
     "tankard": { "winner": "angus-ruthven" },
     "phallus": { "winner": "new-guest", "decidedByPuttOff": true },
     "groupPhoto": "2026-group.jpg"
   }
   ```

   Everything except `year`, `venue` and `participants` is optional. Winner
   points are read from the leaderboard automatically; add `"points": 38` to a
   winner only when there is no scores CSV.

2. Create `data/courses/course-slug.json` with the course's 18 pars
   (`strokeIndex` is optional and only needed if handicaps ever return):

   ```json
   { "name": "Course Name", "par": [4, 5, 3, ...] }
   ```

3. Drop the scorecards in `data/years/2026-scores.csv`:

   ```csv
   name,h1,h2,...,h18
   angus-ruthven,4,5,...,4
   ```

   - `name` is the player's slug (their filename in `data/players/`).
   - Blank cell = picked up (0 points, standard for Stableford).
   - Optional extra columns after `h18`: `points` (a pre-computed total that
     overrides calculation) and `hcp` (handicap).

4. Any new player gets `data/players/their-slug.json`:

   ```json
   { "name": "Their Name", "family": false, "since": 2026, "bio": "..." }
   ```

   Add `"headshot": "their-slug.jpg"` once their photo is in
   `public/photos/players/`. No headshot = a styled monogram.

5. Put the group photo at `public/photos/years/2026-group.jpg`.

6. `git push`. GitHub Actions runs the tests, builds, and deploys. Bad data
   (a typo'd slug, a malformed CSV) fails the build rather than publishing
   wrong scores - read the Actions log for the exact message.

## Swapping in the real images

`src/config.ts` has one slot each for the crest, the Tankard, the Phallus
Trophy, and a photo strip of the family cloth (which replaces the CSS tartan
bands). Put the file in `public/photos/` and set the slot to its filename.

## Sample data

Players, venues, and the 2025 scorecards currently in `data/` are SAMPLES so
the site renders. Replace them with the real history - every sample bio is
marked `SAMPLE PLAYER`.

## Hosting

`astro.config.mjs` assumes `https://<user>.github.io/ruthven/`. If the repo
name or owner differs, update `site` and `base` there. In the repo settings,
set Pages → Source to "GitHub Actions".
