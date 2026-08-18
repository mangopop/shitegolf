import { describe, expect, it } from 'vitest';
import { buildLeaderboard, type Course } from '../src/lib/leaderboard';
import type { ScoreRow } from '../src/lib/scores';

const COURSE: Course = { name: 'Test Links', par: Array(18).fill(4) };

function row(name: string, gross: number, extra: Partial<ScoreRow> = {}): ScoreRow {
  return { name, strokes: Array(18).fill(gross), ...extra };
}

describe('buildLeaderboard', () => {
  it('sorts by points descending', () => {
    const board = buildLeaderboard([row('bogey', 5), row('par', 4)], COURSE);
    expect(board.map((e) => e.slug)).toEqual(['par', 'bogey']);
    expect(board[0]!.totalPoints).toBe(36);
    expect(board[1]!.totalPoints).toBe(18);
  });

  it('gives tied players a shared position and skips the next', () => {
    const board = buildLeaderboard([row('a', 4), row('b', 4), row('c', 5)], COURSE);
    expect(board.map((e) => e.position)).toEqual([1, 1, 3]);
  });

  it('prefers a pre-computed points total over the calculated one', () => {
    const board = buildLeaderboard([row('a', 4, { points: 40 })], COURSE);
    expect(board[0]!.totalPoints).toBe(40);
    expect(board[0]!.card).not.toBeNull();
  });

  it('accepts a points-only row with no course', () => {
    const board = buildLeaderboard([{ name: 'a', strokes: Array(18).fill(null), points: 33 }], null);
    expect(board[0]!.totalPoints).toBe(33);
    expect(board[0]!.card).toBeNull();
    expect(board[0]!.totalStrokes).toBeNull();
  });

  it('ranks strokes ascending, independently of the points order', () => {
    // Stableford floors a hole at 0, so 'spiky' banks birdies and takes the
    // points while its six blow-ups still cost it the strokes count.
    const spiky: ScoreRow = { name: 'spiky', strokes: [...Array(12).fill(3), ...Array(6).fill(10)] };
    const steady = row('steady', 5);
    const board = buildLeaderboard([spiky, steady], COURSE);
    expect(board.map((e) => e.slug)).toEqual(['spiky', 'steady']);
    expect(board.map((e) => e.totalPoints)).toEqual([36, 18]);
    expect(board.map((e) => e.position)).toEqual([1, 2]);
    expect(board.map((e) => e.totalStrokes)).toEqual([96, 90]);
    expect(board.map((e) => e.strokesPosition)).toEqual([2, 1]);
    expect(board.map((e) => e.strokesOrder)).toEqual([1, 0]);
  });

  it('splits strokes across the halves so the row adds up in strokes mode', () => {
    const board = buildLeaderboard([row('a', 5)], COURSE);
    const entry = board[0]!;
    expect([entry.front9Strokes, entry.back9Strokes]).toEqual([45, 45]);
    expect(entry.front9Strokes! + entry.back9Strokes!).toBe(entry.totalStrokes);
  });

  it('gives tied strokes a shared position and skips the next', () => {
    const board = buildLeaderboard([row('a', 4), row('b', 4), row('c', 5)], COURSE);
    expect(board.map((e) => e.strokesPosition)).toEqual([1, 1, 3]);
  });

  it('marks an incomplete card as a no return and sorts it below ranked cards', () => {
    // 'quit' picks up twice, so its recorded total flatters it - 64 beats 72.
    const quit: ScoreRow = { name: 'quit', strokes: [null, null, ...Array(16).fill(4)] };
    const board = buildLeaderboard([row('finished', 4), quit], COURSE);
    const byName = Object.fromEntries(board.map((e) => [e.slug, e]));
    expect(byName.quit!.totalStrokes).toBe(64);
    expect(byName.finished!.totalStrokes).toBe(72);
    expect(byName.quit!.strokesPosition).toBeNull();
    expect(byName.quit!.holesRecorded).toBe(16);
    expect(byName.finished!.strokesPosition).toBe(1);
    expect(byName.finished!.strokesOrder).toBeLessThan(byName.quit!.strokesOrder);
  });

  it('treats a points-only row as a no return with no holes recorded', () => {
    const board = buildLeaderboard([{ name: 'a', strokes: Array(18).fill(null), points: 33 }], null);
    expect(board[0]!.strokesPosition).toBeNull();
    expect(board[0]!.holesRecorded).toBeNull();
  });

  it('rejects strokes without a course', () => {
    expect(() => buildLeaderboard([row('a', 4)], null)).toThrow(/no course/);
  });

  it('rejects a row with neither strokes nor points', () => {
    expect(() => buildLeaderboard([{ name: 'a', strokes: Array(18).fill(null) }], COURSE)).toThrow(
      /neither strokes nor a points total/,
    );
  });
});
