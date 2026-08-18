import { computeCard, type HoleScore } from './stableford';
import type { ScoreRow } from './scores';

export interface Course {
  name: string;
  par: number[];
  strokeIndex?: number[];
  /** Filename under public/photos/courses/, absent = placeholder. */
  photo?: string;
}

export interface LeaderboardEntry {
  slug: string;
  /** 1-based position; tied players share one. */
  position: number;
  totalPoints: number;
  totalStrokes: number | null;
  /**
   * 1-based strokes position, tied players sharing one. Null for a no return:
   * strokes only compare between cards where every hole was holed out, since
   * a picked-up hole adds no strokes and would otherwise flatter the total.
   */
  strokesPosition: number | null;
  /** Sort index for strokes order; ranked cards first, then no returns. */
  strokesOrder: number;
  /** Holes with a recorded stroke count; null when the row carried no card. */
  holesRecorded: number | null;
  front9Points: number | null;
  back9Points: number | null;
  front9Strokes: number | null;
  back9Strokes: number | null;
  /** Per-hole detail, null when the row only carried a points total. */
  card: HoleScore[] | null;
}

type ScoredEntry = Omit<LeaderboardEntry, 'position' | 'strokesPosition' | 'strokesOrder'>;

/** A card only ranks on strokes when every hole was holed out. */
function isCompleteCard(entry: ScoredEntry): boolean {
  return entry.card !== null && entry.card.every((hole) => hole.strokes !== null);
}

export function buildLeaderboard(rows: ScoreRow[], course: Course | null): LeaderboardEntry[] {
  const entries = rows.map((row): ScoredEntry => {
    const hasStrokes = row.strokes.some((s) => s !== null);
    if (hasStrokes && course) {
      const card = computeCard(row.strokes, course.par, {
        handicap: row.handicap,
        strokeIndex: course.strokeIndex,
      });
      return {
        slug: row.name,
        totalPoints: row.points ?? card.totalPoints,
        totalStrokes: card.totalStrokes,
        holesRecorded: card.holes.filter((hole) => hole.strokes !== null).length,
        front9Points: card.front9Points,
        back9Points: card.back9Points,
        front9Strokes: card.front9Strokes,
        back9Strokes: card.back9Strokes,
        card: card.holes,
      };
    }
    if (row.points === undefined) {
      throw new Error(
        `Score row for "${row.name}" has ${hasStrokes ? 'strokes but no course to score them against' : 'neither strokes nor a points total'}`,
      );
    }
    return {
      slug: row.name,
      totalPoints: row.points,
      totalStrokes: null,
      holesRecorded: null,
      front9Points: null,
      back9Points: null,
      front9Strokes: null,
      back9Strokes: null,
      card: null,
    };
  });

  entries.sort((a, b) => b.totalPoints - a.totalPoints);

  // Strokes ranking: complete cards ascending, then no returns by what they did
  // record. Keyed by slug so the points order below stays the returned order.
  const complete = entries.filter(isCompleteCard).sort((a, b) => a.totalStrokes! - b.totalStrokes!);
  const noReturn = entries
    .filter((entry) => !isCompleteCard(entry))
    .sort((a, b) => (a.totalStrokes ?? Infinity) - (b.totalStrokes ?? Infinity));

  const strokesPositions = new Map<string, number>();
  let lastStrokes = NaN;
  let lastStrokesPosition = 0;
  complete.forEach((entry, i) => {
    const position = entry.totalStrokes === lastStrokes ? lastStrokesPosition : i + 1;
    lastStrokes = entry.totalStrokes!;
    lastStrokesPosition = position;
    strokesPositions.set(entry.slug, position);
  });
  const strokesOrders = new Map<string, number>();
  [...complete, ...noReturn].forEach((entry, i) => strokesOrders.set(entry.slug, i));

  let lastPoints = NaN;
  let lastPosition = 0;
  return entries.map((entry, i) => {
    const position = entry.totalPoints === lastPoints ? lastPosition : i + 1;
    lastPoints = entry.totalPoints;
    lastPosition = position;
    return {
      ...entry,
      position,
      strokesPosition: strokesPositions.get(entry.slug) ?? null,
      strokesOrder: strokesOrders.get(entry.slug)!,
    };
  });
}
