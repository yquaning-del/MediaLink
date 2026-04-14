import {
  isValidGhanaPhone,
  toInternationalFormat,
  toLocalFormat,
} from '../../src/utils/phoneFormat';

describe('isValidGhanaPhone', () => {
  const validPrefixes = ['024', '025', '026', '027', '028', '059', '020', '023', '050', '055', '057'];

  test.each(validPrefixes)('accepts a valid %s number', (prefix) => {
    expect(isValidGhanaPhone(`${prefix}1234567`)).toBe(true);
  });

  it('rejects a number that is too short (9 digits)', () => {
    expect(isValidGhanaPhone('024123456')).toBe(false);
  });

  it('rejects a number that is too long (11 digits)', () => {
    expect(isValidGhanaPhone('02412345678')).toBe(false);
  });

  it('rejects a number that does not start with 0', () => {
    expect(isValidGhanaPhone('2441234567')).toBe(false);
  });

  it('rejects a number with an unrecognised prefix', () => {
    expect(isValidGhanaPhone('0311234567')).toBe(false);
  });

  it('strips spaces before validating', () => {
    expect(isValidGhanaPhone('024 123 4567')).toBe(true);
  });

  it('strips dashes before validating', () => {
    expect(isValidGhanaPhone('024-123-4567')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidGhanaPhone('')).toBe(false);
  });
});

describe('toInternationalFormat', () => {
  it('converts local 0XX format to 233XX', () => {
    expect(toInternationalFormat('0241234567')).toBe('233241234567');
  });

  it('strips leading + from +233XX format', () => {
    expect(toInternationalFormat('+233241234567')).toBe('233241234567');
  });

  it('returns already-international format unchanged', () => {
    expect(toInternationalFormat('233241234567')).toBe('233241234567');
  });

  it('strips spaces before converting', () => {
    expect(toInternationalFormat('024 123 4567')).toBe('233241234567');
  });
});

describe('toLocalFormat', () => {
  it('converts 233XX format to 0XX', () => {
    expect(toLocalFormat('233241234567')).toBe('0241234567');
  });

  it('returns already-local format unchanged', () => {
    expect(toLocalFormat('0241234567')).toBe('0241234567');
  });

  it('strips spaces before converting', () => {
    expect(toLocalFormat('233 24 123 4567')).toBe('0241234567');
  });
});
