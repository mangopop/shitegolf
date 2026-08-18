export interface HoleScore {
  strokes: number | null;
  points: number;
}

export interface CardResult {
  holes: HoleScore[];
  totalPoints: number;
  /** Sum of recorded strokes. Null when no hole has a recorded score. */
  totalStrokes: number | null;
  front9Points: number;
  back9Points: number;
  /** Sum of recorded strokes in each half; null when that half is all blanks. */
  front9Strokes: number | null;
  back9Strokes: number | null;
}

/**
 * Handicap strokes received on a hole under standard allocation:
 * one stroke per full 18 of handicap, plus one on holes whose stroke
 * index is within the remainder.
 */
export function strokesReceived(handicap: number, strokeIndex: number): number {
  const base = Math.floor(handicap / 18);
  const extra = strokeIndex <= handicap % 18 ? 1 : 0;
  return base + extra;
}

/**
 * Stableford points for one hole. Par nets 2 points, each stroke better
 * adds one, each stroke worse subtracts one, floored at 0.
 * A blank (picked up) hole scores 0.
 */
export function holePoints(gross: number | null, par: number, received = 0): number {
  if (gross === null) return 0;
  return Math.max(0, par + received - gross + 2);
}

export interface CardOptions {
  handicap?: number;
  strokeIndex?: number[];
}

export function computeCard(
  strokes: (number | null)[],
  par: number[],
  opts: CardOptions = {},
): CardResult {
  if (strokes.length !== par.length) {
    throw new Error(`Card has ${strokes.length} holes but course has ${par.length}`);
  }
  const handicap = opts.handicap ?? 0;
  if (handicap > 0 && !opts.strokeIndex) {
    throw new Error('Handicap given but course has no stroke index');
  }
  const holes: HoleScore[] = strokes.map((gross, i) => {
    const received = handicap > 0 ? strokesReceived(handicap, opts.strokeIndex![i]!) : 0;
    return { strokes: gross, points: holePoints(gross, par[i]!, received) };
  });
  const half = Math.ceil(holes.length / 2);
  const sumStrokes = (subset: HoleScore[]): number | null => {
    const recorded = subset.filter((h) => h.strokes !== null);
    return recorded.length === 0 ? null : recorded.reduce((sum, h) => sum + h.strokes!, 0);
  };
  return {
    holes,
    totalPoints: holes.reduce((sum, h) => sum + h.points, 0),
    totalStrokes: sumStrokes(holes),
    front9Points: holes.slice(0, half).reduce((sum, h) => sum + h.points, 0),
    back9Points: holes.slice(half).reduce((sum, h) => sum + h.points, 0),
    front9Strokes: sumStrokes(holes.slice(0, half)),
    back9Strokes: sumStrokes(holes.slice(half)),
  };
}
