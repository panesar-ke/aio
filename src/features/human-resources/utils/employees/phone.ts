/**
 * Normalises a Kenyan mobile number to the 10-digit local format stored in the
 * database (07XXXXXXXX / 01XXXXXXXX). Accepts spaces, dashes, "+254" and "254".
 * Returns null when the input is not a valid Kenyan mobile number.
 */
export function normalizeKenyanPhone(input: string): string | null {
  let digits = input.replace(/[\s()-]/g, '');
  if (digits.startsWith('+254')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('254') && digits.length === 12) {
    digits = `0${digits.slice(3)}`;
  }
  return /^0[17]\d{8}$/.test(digits) ? digits : null;
}

export const isValidKenyanPhone = (input: string) =>
  normalizeKenyanPhone(input) !== null;

/** Looser check for next-of-kin numbers, which may be landlines or foreign. */
export const isPlausiblePhone = (input: string) =>
  /^\+?[\d\s()-]{9,15}$/.test(input);
