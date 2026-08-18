export interface ScoreRow {
  /** Player slug matching a file in data/players/. */
  name: string;
  /** 18 gross stroke counts; null = picked up. */
  strokes: (number | null)[];
  /** Pre-computed total Stableford points; overrides computation when present. */
  points?: number;
  /** Optional handicap; 0 / absent = gross scoring. */
  handicap?: number;
}

const HOLE_COLUMNS = Array.from({ length: 18 }, (_, i) => `h${i + 1}`);

/**
 * Parse a year's scores CSV. Expected header: name,h1..h18 with optional
 * trailing points and/or hcp columns. Throws on anything malformed so a
 * bad file fails the build instead of publishing wrong scores.
 */
export function parseScoresCsv(text: string): ScoreRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new Error('Scores CSV needs a header row and at least one player row');
  }

  const header = lines[0]!.split(',').map((c) => c.trim().toLowerCase());
  if (header[0] !== 'name') {
    throw new Error(`Scores CSV first column must be "name", got "${header[0]}"`);
  }
  for (let i = 0; i < 18; i++) {
    if (header[i + 1] !== HOLE_COLUMNS[i]) {
      throw new Error(`Scores CSV column ${i + 2} must be "${HOLE_COLUMNS[i]}", got "${header[i + 1] ?? 'nothing'}"`);
    }
  }
  const extras = header.slice(19);
  for (const col of extras) {
    if (col !== 'points' && col !== 'hcp') {
      throw new Error(`Scores CSV has unknown column "${col}" (only "points" and "hcp" are allowed after h18)`);
    }
  }

  return lines.slice(1).map((line, rowIndex) => {
    const cells = line.split(',').map((c) => c.trim());
    if (cells.length !== header.length) {
      throw new Error(`Scores CSV row ${rowIndex + 2} has ${cells.length} cells, expected ${header.length}`);
    }
    const name = cells[0]!;
    if (!name) throw new Error(`Scores CSV row ${rowIndex + 2} has an empty name`);

    const strokes = cells.slice(1, 19).map((cell, holeIndex) => {
      if (cell === '') return null;
      const n = Number(cell);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Scores CSV row ${rowIndex + 2} (${name}), hole ${holeIndex + 1}: "${cell}" is not a stroke count`);
      }
      return n;
    });

    const row: ScoreRow = { name, strokes };
    extras.forEach((col, i) => {
      const cell = cells[19 + i]!;
      if (cell === '') return;
      const n = Number(cell);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`Scores CSV row ${rowIndex + 2} (${name}): ${col} "${cell}" is not a number`);
      }
      if (col === 'points') row.points = n;
      else row.handicap = n;
    });
    return row;
  });
}
