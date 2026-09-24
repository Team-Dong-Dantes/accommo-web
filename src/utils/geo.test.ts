import { describe, expect, it } from 'vitest';
import { CAMPUS, kmBetween } from './geo';

describe('kmBetween', () => {
  it('measures a known separation', () => {
    // Dammang Transient Rooms, the furthest Echague accommodation on file.
    const km = kmBetween(CAMPUS.lat, CAMPUS.lng, 16.6847, 121.6934);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(5);
  });

  it('measures a point against itself as zero', () => {
    expect(kmBetween(CAMPUS.lat, CAMPUS.lng, CAMPUS.lat, CAMPUS.lng)).toBe(0);
  });
});

describe('CAMPUS', () => {
  // The web app used to hardcode [121.720, 16.710] in two map files, labelled
  // "ISU Echague" — about 4 km off, which put the admin map's opening view on
  // empty ground east of every accommodation. Guard the real coordinates so it
  // cannot drift back.
  it('sits far enough from the retired hardcoded centre to matter', () => {
    expect(kmBetween(CAMPUS.lat, CAMPUS.lng, 16.71, 121.72)).toBeGreaterThan(3);
  });

  it('agrees with the mobile app to the metre', () => {
    expect(CAMPUS.lat).toBe(16.721560301578872);
    expect(CAMPUS.lng).toBe(121.68526268921849);
  });
});
