import { describe, expect, it } from 'vitest';
import {
  dayLabel,
  getInitials,
  getInitialsWide,
  roleLabel,
} from './format';

describe('dayLabel', () => {
  const now = new Date(2026, 7, 30, 12);

  it('labels the current calendar day as today', () => {
    expect(dayLabel('2026-08-30T00:01:00', now)).toBe('Today');
  });

  it('labels the prior calendar day as yesterday', () => {
    expect(dayLabel('2026-08-29T23:59:00', now)).toBe('Yesterday');
  });

  it('preserves the correct month for older dates', () => {
    expect(dayLabel('2026-08-28T12:00:00', now)).toBe('Aug 28, 2026');
  });

  it('handles invalid dates safely', () => {
    expect(dayLabel('not-a-date', now)).toBe('Unknown date');
  });
});

describe('string formatters', () => {
  it('creates initials consistently for single and multi-word names', () => {
    expect(getInitials('Maria Santos')).toBe('MS');
    expect(getInitials('Maria')).toBe('M');
    expect(getInitialsWide('Maria')).toBe('MA');
  });

  it('maps known roles to human-readable labels', () => {
    expect(roleLabel('admin')).toBe('Administrator');
    expect(roleLabel('accommodation_manager')).toBe('Accommodation Manager');
    expect(roleLabel(null)).toBe('User');
  });
});
