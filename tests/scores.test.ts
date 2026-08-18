import { describe, expect, it } from 'vitest';
import { parseScoresCsv } from '../src/lib/scores';

const HEADER = 'name,' + Array.from({ length: 18 }, (_, i) => `h${i + 1}`).join(',');
const PAR_ROW = Array(18).fill(4).join(',');

describe('parseScoresCsv', () => {
  it('parses names and strokes', () => {
    const rows = parseScoresCsv(`${HEADER}\nangus,${PAR_ROW}`);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe('angus');
    expect(rows[0]!.strokes).toEqual(Array(18).fill(4));
  });

  it('reads blanks as picked up', () => {
    const cells = Array(18).fill('4');
    cells[7] = '';
    const rows = parseScoresCsv(`${HEADER}\nangus,${cells.join(',')}`);
    expect(rows[0]!.strokes[7]).toBeNull();
  });

  it('accepts optional points and hcp columns', () => {
    const rows = parseScoresCsv(`${HEADER},points,hcp\nangus,${PAR_ROW},31,12`);
    expect(rows[0]!.points).toBe(31);
    expect(rows[0]!.handicap).toBe(12);
  });

  it('rejects unknown columns', () => {
    expect(() => parseScoresCsv(`${HEADER},beers\nangus,${PAR_ROW},9`)).toThrow(/unknown column "beers"/);
  });

  it('rejects a wrong hole header', () => {
    expect(() => parseScoresCsv(`${HEADER.replace('h18', 'h19')}\nangus,${PAR_ROW}`)).toThrow(/must be "h18"/);
  });

  it('rejects rows with the wrong cell count', () => {
    expect(() => parseScoresCsv(`${HEADER}\nangus,4,4`)).toThrow(/row 2 has 3 cells/);
  });

  it('rejects non-numeric strokes with the player and hole named', () => {
    const cells = Array(18).fill('4');
    cells[2] = 'x';
    expect(() => parseScoresCsv(`${HEADER}\nangus,${cells.join(',')}`)).toThrow(/\(angus\), hole 3/);
  });

  it('rejects an empty file', () => {
    expect(() => parseScoresCsv('\n')).toThrow(/header row/);
  });
});
