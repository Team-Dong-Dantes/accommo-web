import { describe, expect, it } from 'vitest';
import { screenGateState } from './screenGate';

describe('screenGateState', () => {
  it('never gates a desktop, however small the window', () => {
    expect(screenGateState(500, 400, false)).toBe(null);
    expect(screenGateState(900, 500, false)).toBe(null);
  });

  it('shows the app on a tablet in landscape', () => {
    expect(screenGateState(1024, 768, true)).toBe(null);
    expect(screenGateState(1280, 800, true)).toBe(null);
  });

  it('asks a portrait tablet to rotate', () => {
    expect(screenGateState(768, 1024, true)).toBe('rotate');
  });

  // The distinction the CSS `orientation` query cannot make: rotating a phone
  // will not make it big enough, so it must not be told to try.
  it('tells a phone it is too small in either orientation', () => {
    expect(screenGateState(390, 844, true)).toBe('small');
    expect(screenGateState(844, 390, true)).toBe('small');
  });

  it('treats a landscape screen that is too short as too small', () => {
    expect(screenGateState(1280, 560, true)).toBe('small');
  });
});
