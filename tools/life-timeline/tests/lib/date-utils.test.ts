import {
  getLocalToday,
  parseLocalDate,
  formatLocalDate,
  daysBetween,
  addYears,
  isValidDateFormat,
} from '@/lib/date-utils';

describe('getLocalToday', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const today = getLocalToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the current local date', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(getLocalToday()).toBe(expected);
  });
});

describe('parseLocalDate', () => {
  it('parses a standard date correctly', () => {
    const date = parseLocalDate('2023-06-15');
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(5); // 0-indexed
    expect(date.getDate()).toBe(15);
  });

  it('parses January 1st correctly', () => {
    const date = parseLocalDate('2020-01-01');
    expect(date.getFullYear()).toBe(2020);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it('parses December 31st correctly', () => {
    const date = parseLocalDate('2023-12-31');
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(31);
  });

  it('parses a leap year date (Feb 29)', () => {
    const date = parseLocalDate('2024-02-29');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(29);
  });

  it('parses year 1900', () => {
    const date = parseLocalDate('1900-01-01');
    expect(date.getFullYear()).toBe(1900);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });
});

describe('formatLocalDate', () => {
  it('formats a date with zero-padded month and day', () => {
    const date = new Date(2023, 0, 5); // Jan 5, 2023
    expect(formatLocalDate(date)).toBe('2023-01-05');
  });

  it('formats a date without needing padding', () => {
    const date = new Date(2023, 11, 25); // Dec 25, 2023
    expect(formatLocalDate(date)).toBe('2023-12-25');
  });

  it('formats February 29 in a leap year', () => {
    const date = new Date(2024, 1, 29);
    expect(formatLocalDate(date)).toBe('2024-02-29');
  });

  it('formats year 1900', () => {
    const date = new Date(1900, 0, 1);
    expect(formatLocalDate(date)).toBe('1900-01-01');
  });

  it('formats a date in the far future', () => {
    const date = new Date(2050, 5, 15);
    expect(formatLocalDate(date)).toBe('2050-06-15');
  });
});

describe('daysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetween('2023-06-15', '2023-06-15')).toBe(0);
  });

  it('calculates days between two dates in the same month', () => {
    expect(daysBetween('2023-06-01', '2023-06-15')).toBe(14);
  });

  it('returns absolute value regardless of order', () => {
    expect(daysBetween('2023-06-15', '2023-06-01')).toBe(14);
  });

  it('calculates days across months', () => {
    // Jan 1 to Feb 1 = 31 days
    expect(daysBetween('2023-01-01', '2023-02-01')).toBe(31);
  });

  it('calculates days across years', () => {
    // Dec 31, 2022 to Jan 1, 2023 = 1 day
    expect(daysBetween('2022-12-31', '2023-01-01')).toBe(1);
  });

  it('calculates days for a full non-leap year', () => {
    expect(daysBetween('2023-01-01', '2024-01-01')).toBe(365);
  });

  it('calculates days for a full leap year', () => {
    expect(daysBetween('2024-01-01', '2025-01-01')).toBe(366);
  });
});

describe('addYears', () => {
  it('adds years to a normal date', () => {
    expect(addYears('2020-06-15', 3)).toBe('2023-06-15');
  });

  it('adds 0 years returns same date', () => {
    expect(addYears('2023-06-15', 0)).toBe('2023-06-15');
  });

  it('handles leap year edge case: Feb 29 + 1 year = Feb 28', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
  });

  it('handles leap year edge case: Feb 29 + 4 years = Feb 29 (next leap year)', () => {
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
  });

  it('subtracts years with negative value', () => {
    expect(addYears('2023-06-15', -3)).toBe('2020-06-15');
  });

  it('handles negative years from leap day: Feb 29 - 1 year = Feb 28', () => {
    expect(addYears('2024-02-29', -1)).toBe('2023-02-28');
  });

  it('handles crossing from non-leap to leap year', () => {
    expect(addYears('2023-02-28', 1)).toBe('2024-02-28');
  });

  it('adds years to Jan 1', () => {
    expect(addYears('2020-01-01', 5)).toBe('2025-01-01');
  });

  it('adds years to Dec 31', () => {
    expect(addYears('2020-12-31', 1)).toBe('2021-12-31');
  });
});

describe('isValidDateFormat', () => {
  describe('valid dates', () => {
    it('accepts a normal valid date', () => {
      expect(isValidDateFormat('2023-06-15')).toBe(true);
    });

    it('accepts Jan 1', () => {
      expect(isValidDateFormat('2023-01-01')).toBe(true);
    });

    it('accepts Dec 31', () => {
      expect(isValidDateFormat('2023-12-31')).toBe(true);
    });

    it('accepts leap year Feb 29', () => {
      expect(isValidDateFormat('2024-02-29')).toBe(true);
    });

    it('accepts year 1900', () => {
      expect(isValidDateFormat('1900-01-01')).toBe(true);
    });

    it('accepts year 2050', () => {
      expect(isValidDateFormat('2050-12-31')).toBe(true);
    });
  });

  describe('invalid format', () => {
    it('rejects wrong separator (slash)', () => {
      expect(isValidDateFormat('2023/06/15')).toBe(false);
    });

    it('rejects wrong separator (dot)', () => {
      expect(isValidDateFormat('2023.06.15')).toBe(false);
    });

    it('rejects missing parts', () => {
      expect(isValidDateFormat('2023-06')).toBe(false);
    });

    it('rejects single digit month', () => {
      expect(isValidDateFormat('2023-6-15')).toBe(false);
    });

    it('rejects single digit day', () => {
      expect(isValidDateFormat('2023-06-5')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidDateFormat('')).toBe(false);
    });

    it('rejects non-date string', () => {
      expect(isValidDateFormat('hello')).toBe(false);
    });

    it('rejects extra characters', () => {
      expect(isValidDateFormat('2023-06-15T00:00:00')).toBe(false);
    });
  });

  describe('invalid dates (correct format but non-existent)', () => {
    it('rejects Feb 29 in non-leap year', () => {
      expect(isValidDateFormat('2023-02-29')).toBe(false);
    });

    it('rejects month 13', () => {
      expect(isValidDateFormat('2023-13-01')).toBe(false);
    });

    it('rejects month 00', () => {
      expect(isValidDateFormat('2023-00-01')).toBe(false);
    });

    it('rejects day 00', () => {
      expect(isValidDateFormat('2023-01-00')).toBe(false);
    });

    it('rejects Apr 31 (April has 30 days)', () => {
      expect(isValidDateFormat('2023-04-31')).toBe(false);
    });

    it('rejects Jun 31 (June has 30 days)', () => {
      expect(isValidDateFormat('2023-06-31')).toBe(false);
    });

    it('rejects Feb 30', () => {
      expect(isValidDateFormat('2023-02-30')).toBe(false);
    });
  });
});
