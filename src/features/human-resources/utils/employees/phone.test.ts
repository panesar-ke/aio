import { describe, expect, it } from 'vitest';

import { isPlausiblePhone, normalizeKenyanPhone } from './phone';

describe('normalizeKenyanPhone', () => {
  it('normalises spaced, dashed and international formats', () => {
    expect(normalizeKenyanPhone('0722 123 456')).toBe('0722123456');
    expect(normalizeKenyanPhone('0722-123-456')).toBe('0722123456');
    expect(normalizeKenyanPhone('+254722123456')).toBe('0722123456');
    expect(normalizeKenyanPhone('254722123456')).toBe('0722123456');
    expect(normalizeKenyanPhone('0110123456')).toBe('0110123456');
  });

  it('rejects invalid numbers', () => {
    expect(normalizeKenyanPhone('')).toBeNull();
    expect(normalizeKenyanPhone('072212345')).toBeNull();
    expect(normalizeKenyanPhone('07221234567')).toBeNull();
    expect(normalizeKenyanPhone('0522123456')).toBeNull();
    expect(normalizeKenyanPhone('abcdefghij')).toBeNull();
  });
});

describe('isPlausiblePhone', () => {
  it('accepts landlines and foreign numbers, rejects junk', () => {
    expect(isPlausiblePhone('020 123 4567')).toBe(true);
    expect(isPlausiblePhone('+256 700 123456')).toBe(true);
    expect(isPlausiblePhone('12345')).toBe(false);
    expect(isPlausiblePhone('not a phone')).toBe(false);
  });
});
