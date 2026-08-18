import { describe, expect, it } from 'vitest';
import { assembleSite, playerStats, type RawSiteInput } from '../src/lib/site';

const HEADER = 'name,' + Array.from({ length: 18 }, (_, i) => `h${i + 1}`).join(',');
const PAR_ROW = Array(18).fill(4).join(',');

function baseInput(): RawSiteInput {
  return {
    years: [
      {
        year: 2024,
        venue: 'Old Course',
        participants: ['angus'],
        tankard: { winner: 'angus' },
      },
      {
        year: 2025,
        venue: 'New Course',
        participants: ['angus', 'guest'],
        course: 'new-course',
        tankard: { winner: 'angus', points: 36 },
        phallus: { winner: 'guest', points: 18 },
        longestDrive: { winner: 'guest', distance: '287 yards' },
        closestToPin: { winner: 'angus' },
      },
    ],
    scoresCsv: { 2025: `${HEADER}\nangus,${PAR_ROW}\nguest,${Array(18).fill(5).join(',')}` },
    courses: { 'new-course': { name: 'New Course', par: Array(18).fill(4) } },
    players: {
      angus: { name: 'Angus', family: true, since: 2021, bio: 'Founder.' },
      guest: { name: 'Guest', family: false, since: 2025, bio: 'Invited.' },
    },
  };
}

describe('assembleSite', () => {
  it('builds leaderboards for years with scores and none for years without', () => {
    const site = assembleSite(baseInput());
    expect(site.years.map((y) => y.year)).toEqual([2024, 2025]);
    expect(site.years[0]!.leaderboard).toBeNull();
    expect(site.years[1]!.leaderboard!.map((e) => e.slug)).toEqual(['angus', 'guest']);
  });

  it('rejects a participant without a player file', () => {
    const input = baseInput();
    input.years[0]!.participants.push('nobody');
    expect(() => assembleSite(input)).toThrow(/data\/players\/nobody\.json/);
  });

  it('rejects a winner without a player file', () => {
    const input = baseInput();
    input.years[0]!.tankard = { winner: 'nobody' };
    expect(() => assembleSite(input)).toThrow(/winner "nobody"/);
  });

  it('rejects a side competition winner without a player file', () => {
    const input = baseInput();
    input.years[0]!.longestDrive = { winner: 'nobody' };
    expect(() => assembleSite(input)).toThrow(/winner "nobody"/);

    const other = baseInput();
    other.years[0]!.closestToPin = { winner: 'nobody' };
    expect(() => assembleSite(other)).toThrow(/winner "nobody"/);
  });

  it('rejects a missing course file', () => {
    const input = baseInput();
    input.years[1]!.course = 'atlantis';
    expect(() => assembleSite(input)).toThrow(/atlantis/);
  });

  it('rejects a scored player who is not a participant, naming the year', () => {
    const input = baseInput();
    input.scoresCsv[2025] += `\nintruder,${PAR_ROW}`;
    expect(() => assembleSite(input)).toThrow(/Year 2025:.*"intruder"/);
  });
});

describe('playerStats', () => {
  it('collects wins, years played and best points', () => {
    const site = assembleSite(baseInput());
    const stats = playerStats(site, 'angus');
    expect(stats.tankardWins).toEqual([2024, 2025]);
    expect(stats.phallusWins).toEqual([]);
    expect(stats.yearsPlayed).toEqual([2024, 2025]);
    expect(stats.bestPoints).toBe(36);
  });

  it('collects side competition wins', () => {
    const site = assembleSite(baseInput());
    expect(playerStats(site, 'angus').closestToPinWins).toEqual([2025]);
    expect(playerStats(site, 'angus').longestDriveWins).toEqual([]);
    expect(playerStats(site, 'guest').longestDriveWins).toEqual([2025]);
    expect(playerStats(site, 'guest').closestToPinWins).toEqual([]);
  });
});
