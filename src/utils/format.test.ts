import { describe, expect, it } from 'vitest';
import {
  cap,
  capitalize,
  composeAddress,
  csvDate,
  dayLabel,
  escapeHtml,
  fmtDate,
  formatPhone,
  getInitials,
  getInitialsWide,
  roleLabel,
} from './format';

describe('escapeHtml', () => {
  // The drawer's activity feed renders these strings with v-html, so a name is
  // an injection point. This is the regression guard for that.
  it('neutralises a script-bearing display name', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
  });

  it('escapes quotes so a value cannot break out of an attribute', () => {
    expect(escapeHtml(`" onmouseover="evil()`)).toBe(
      '&quot; onmouseover=&quot;evil()',
    );
    expect(escapeHtml("O'Brien")).toBe('O&#39;Brien');
  });

  it('escapes ampersands first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves ordinary names untouched', () => {
    expect(escapeHtml('Mario Santos')).toBe('Mario Santos');
  });

  it('renders null and undefined as empty rather than the words', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

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

describe('fmtDate', () => {
  // This replaced three separate copies (announcements, audit logs, user
  // drawer). These cases pin the format so the next surface that needs a date
  // reuses it instead of growing a fourth.
  it('renders a calendar date', () => {
    expect(fmtDate('2026-09-22T03:05:00Z')).toBe('Sep 22, 2026');
  });

  it('renders a missing date as an em dash', () => {
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate(undefined)).toBe('—');
    expect(fmtDate('')).toBe('—');
  });

  it('renders an unparseable date as an em dash rather than "Invalid Date"', () => {
    expect(fmtDate('not-a-date')).toBe('—');
  });
});

describe('cap vs capitalize', () => {
  // These two differ on purpose and the difference is load-bearing: the
  // verification queue relies on capitalize('') === 'Pending'. Guard both so a
  // future "cleanup" cannot quietly merge them.
  it('cap preserves the tail so an acronym survives', () => {
    expect(cap('osas verified')).toBe('Osas verified');
    expect(cap('OSAS')).toBe('OSAS');
  });

  it('cap renders empty input as an em dash', () => {
    expect(cap('')).toBe('—');
    expect(cap(null)).toBe('—');
  });

  it('capitalize lowercases the tail and defaults to Pending', () => {
    expect(capitalize('REVIEWING')).toBe('Reviewing');
    expect(capitalize('')).toBe('Pending');
  });
});

describe('composeAddress', () => {
  // 12 of the 13 accommodations on file have the barangay typed into the street
  // field as well, so a plain join repeated it on screen.
  it('drops a barangay the street line already contains', () => {
    expect(composeAddress({ address: 'Purok 5, Silauan Sur', barangay: 'Silauan Sur', city: 'Echague' }))
      .toBe('Purok 5, Silauan Sur, Echague');
  });

  it('keeps a barangay the street line does not mention', () => {
    expect(composeAddress({ address: 'Purok 1', barangay: 'Angoluan', city: 'Echague' }))
      .toBe('Purok 1, Angoluan, Echague');
  });

  it('ignores case when deciding it is a repeat', () => {
    expect(composeAddress({ address: 'Purok 3, SOYUNG', barangay: 'Soyung', city: 'Echague' }))
      .toBe('Purok 3, SOYUNG, Echague');
  });

  it('skips blank parts and renders nothing as an em dash', () => {
    expect(composeAddress({ address: '', barangay: null, city: 'Echague' })).toBe('Echague');
    expect(composeAddress({ address: null, barangay: null, city: null })).toBe('—');
    expect(composeAddress(null)).toBe('—');
  });
});

describe('csvDate', () => {
  it('truncates a timestamp to a sortable date', () => {
    expect(csvDate('2026-09-22T03:05:00Z')).toBe('2026-09-22');
  });

  it('renders a missing value as an empty cell', () => {
    expect(csvDate(null)).toBe('');
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
    expect(roleLabel('landlord')).toBe('Landlord/Landlady');
    expect(roleLabel(null)).toBe('User');
  });
});

describe('formatPhone', () => {
  it('groups a +63 or 0-prefixed mobile number', () => {
    expect(formatPhone('+639763126760')).toBe('+63 976 312 6760');
    expect(formatPhone('09763126760')).toBe('+63 976 312 6760');
  });

  it('leaves anything else as typed', () => {
    expect(formatPhone('(078) 305-1234')).toBe('(078) 305-1234');
  });
});
