import { describe, expect, it } from 'vitest';
import { computeCard, holePoints, strokesReceived } from '../src/lib/stableford';

describe('holePoints', () => {
  it('scores par as 2, birdie 3, eagle 4, bogey 1, double bogey 0', () => {
    expect(holePoints(4, 4)).toBe(2);
    expect(holePoints(3, 4)).toBe(3);
    expect(holePoints(2, 4)).toBe(4);
    expect(holePoints(5, 4)).toBe(1);
    expect(holePoints(6, 4)).toBe(0);
  });

  it('never goes below zero', () => {
    expect(holePoints(12, 3)).toBe(0);
  });

  it('scores a picked-up hole (blank) as 0', () => {
    expect(holePoints(null, 4)).toBe(0);
  });

  it('applies received handicap strokes', () => {
    expect(holePoints(5, 4, 1)).toBe(2); // net par
    expect(holePoints(6, 4, 2)).toBe(2);
  });
});

describe('strokesReceived', () => {
  it('gives one stroke on holes with stroke index within the handicap', () => {
    expect(strokesReceived(9, 9)).toBe(1);
    expect(strokesReceived(9, 10)).toBe(0);
  });

  it('gives everyone a stroke plus extras for handicaps over 18', () => {
    expect(strokesReceived(20, 1)).toBe(2);
    expect(strokesReceived(20, 2)).toBe(2);
    expect(strokesReceived(20, 3)).toBe(1);
    expect(strokesReceived(20, 18)).toBe(1);
  });

  it('gives no strokes off scratch', () => {
    expect(strokesReceived(0, 1)).toBe(0);
  });
});

const PAR = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4];

describe('computeCard', () => {
  it('computes totals, front and back nine points', () => {
    const allPar = [...PAR];
    const card = computeCard(allPar, PAR);
    expect(card.totalPoints).toBe(36);
    expect(card.front9Points).toBe(18);
    expect(card.back9Points).toBe(18);
    expect(card.totalStrokes).toBe(PAR.reduce((a, b) => a + b, 0));
  });

  it('treats blanks as zero points and excludes them from stroke totals', () => {
    const strokes: (number | null)[] = [...PAR];
    strokes[5] = null;
    const card = computeCard(strokes, PAR);
    expect(card.totalPoints).toBe(34);
    expect(card.holes[5]).toEqual({ strokes: null, points: 0 });
    expect(card.totalStrokes).toBe(PAR.reduce((a, b) => a + b, 0) - PAR[5]!);
  });

  it('returns null stroke total for an all-blank card', () => {
    const card = computeCard(Array(18).fill(null), PAR);
    expect(card.totalStrokes).toBeNull();
    expect(card.totalPoints).toBe(0);
  });

  it('rejects a card whose hole count does not match the course', () => {
    expect(() => computeCard([4, 4], PAR)).toThrow(/2 holes/);
  });

  it('rejects a handicap without a stroke index', () => {
    expect(() => computeCard([...PAR], PAR, { handicap: 10 })).toThrow(/stroke index/);
  });

  it('applies handicap via stroke index', () => {
    const strokeIndex = Array.from({ length: 18 }, (_, i) => i + 1);
    const card = computeCard([...PAR], PAR, { handicap: 18, strokeIndex });
    expect(card.totalPoints).toBe(54); // net birdie everywhere
  });
});
