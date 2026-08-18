import { parseScoresCsv } from './scores';
import { buildLeaderboard, type Course, type LeaderboardEntry } from './leaderboard';

export interface PlayerFile {
  name: string;
  family: boolean;
  since: number;
  bio: string;
  /** Filename under public/photos/players/, absent = monogram placeholder. */
  headshot?: string;
}

export interface PrizeResult {
  /** Player slug. */
  winner: string;
  points?: number;
  decidedByPuttOff?: boolean;
  /** Free text as measured on the day, e.g. '287 yards' or '4 ft 2 in'. */
  distance?: string;
}

export interface YearFile {
  year: number;
  venue: string;
  date?: string;
  location?: string;
  tankard?: PrizeResult;
  phallus?: PrizeResult;
  /** Side competition: furthest drive down a nominated hole. */
  longestDrive?: PrizeResult;
  /** Side competition: nearest the flag on a nominated par 3. */
  closestToPin?: PrizeResult;
  participants: string[];
  /** Course slug in data/courses/, needed when scores carry strokes. */
  course?: string;
  /** Filename under public/photos/years/. */
  groupPhoto?: string;
}

export interface YearData extends YearFile {
  courseData: Course | null;
  leaderboard: LeaderboardEntry[] | null;
}

export interface SiteData {
  /** Ascending by year. */
  years: YearData[];
  players: Record<string, PlayerFile>;
}

export interface RawSiteInput {
  years: YearFile[];
  /** CSV text keyed by year. */
  scoresCsv: Record<number, string>;
  courses: Record<string, Course>;
  players: Record<string, PlayerFile>;
}

/** Pure assembly + validation; throws with a clear message on bad data. */
export function assembleSite(input: RawSiteInput): SiteData {
  const years = [...input.years].sort((a, b) => a.year - b.year);

  for (const year of years) {
    for (const slug of year.participants) {
      if (!input.players[slug]) {
        throw new Error(`Year ${year.year} lists participant "${slug}" but data/players/${slug}.json does not exist`);
      }
    }
    for (const prize of [year.tankard, year.phallus, year.longestDrive, year.closestToPin]) {
      if (prize && !input.players[prize.winner]) {
        throw new Error(`Year ${year.year} names winner "${prize.winner}" but data/players/${prize.winner}.json does not exist`);
      }
    }
    if (year.course && !input.courses[year.course]) {
      throw new Error(`Year ${year.year} references course "${year.course}" but data/courses/${year.course}.json does not exist`);
    }
  }

  const yearData = years.map((year): YearData => {
    const csv = input.scoresCsv[year.year];
    const courseData = year.course ? input.courses[year.course]! : null;
    if (!csv) return { ...year, courseData, leaderboard: null };

    let leaderboard: LeaderboardEntry[];
    try {
      const rows = parseScoresCsv(csv);
      for (const row of rows) {
        if (!year.participants.includes(row.name)) {
          throw new Error(`scores list "${row.name}" who is not in the year's participants`);
        }
      }
      leaderboard = buildLeaderboard(rows, courseData);
    } catch (err) {
      throw new Error(`Year ${year.year}: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
    }
    return { ...year, courseData, leaderboard };
  });

  return { years: yearData, players: input.players };
}

function stripKeysToSlug<T>(modules: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, mod]) => [path.replace(/^.*\//, '').replace(/\.(json|csv)$/, ''), mod]),
  );
}

/** Load everything from data/ at build time. */
export function loadSite(): SiteData {
  const yearModules = import.meta.glob<{ default: YearFile }>('../../data/years/*.json', { eager: true });
  const csvModules = import.meta.glob<string>('../../data/years/*.csv', { eager: true, query: '?raw', import: 'default' });
  const courseModules = import.meta.glob<{ default: Course }>('../../data/courses/*.json', { eager: true });
  const playerModules = import.meta.glob<{ default: PlayerFile }>('../../data/players/*.json', { eager: true });

  const scoresCsv: Record<number, string> = {};
  for (const [slug, text] of Object.entries(stripKeysToSlug(csvModules))) {
    const match = slug.match(/^(\d{4})-scores$/);
    if (!match) throw new Error(`Unexpected CSV "${slug}.csv" in data/years/ (expected <year>-scores.csv)`);
    scoresCsv[Number(match[1])] = text;
  }

  return assembleSite({
    years: Object.values(yearModules).map((m) => m.default),
    scoresCsv,
    courses: Object.fromEntries(
      Object.entries(stripKeysToSlug(courseModules)).map(([slug, m]) => [slug, m.default]),
    ),
    players: Object.fromEntries(
      Object.entries(stripKeysToSlug(playerModules)).map(([slug, m]) => [slug, m.default]),
    ),
  });
}

export interface PlayerStats {
  tankardWins: number[];
  phallusWins: number[];
  longestDriveWins: number[];
  closestToPinWins: number[];
  yearsPlayed: number[];
  bestPoints: number | null;
}

export function playerStats(site: SiteData, slug: string): PlayerStats {
  const tankardWins = site.years.filter((y) => y.tankard?.winner === slug).map((y) => y.year);
  const phallusWins = site.years.filter((y) => y.phallus?.winner === slug).map((y) => y.year);
  const longestDriveWins = site.years.filter((y) => y.longestDrive?.winner === slug).map((y) => y.year);
  const closestToPinWins = site.years.filter((y) => y.closestToPin?.winner === slug).map((y) => y.year);
  const yearsPlayed = site.years.filter((y) => y.participants.includes(slug)).map((y) => y.year);
  const pointsSeen = site.years.flatMap(
    (y) => y.leaderboard?.filter((e) => e.slug === slug).map((e) => e.totalPoints) ?? [],
  );
  return {
    tankardWins,
    phallusWins,
    longestDriveWins,
    closestToPinWins,
    yearsPlayed,
    bestPoints: pointsSeen.length ? Math.max(...pointsSeen) : null,
  };
}
