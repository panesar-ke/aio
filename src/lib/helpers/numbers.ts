import Big from 'big.js';

export type NumericValue = string | number | Big | null | undefined;

export const toNumber = (value: NumericValue) => {
  return toBig(value).toNumber();
};

export function toNullableNumber(value: NumericValue): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  try {
    return new Big(value).toNumber();
  } catch {
    return null;
  }
}

export function toDecimalString(value: NumericValue, decimals = 2) {
  return toBig(value).round(decimals, Big.roundHalfUp).toFixed(decimals);
}

export function toNullableString(
  value: NumericValue,
  decimals = 2,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return toDecimalString(value, decimals);
}

export function toDecimalNumber(value: NumericValue, decimals = 2) {
  return Number(toDecimalString(value, decimals));
}

export function toNullishNumber(value: NumericValue): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return toNumber(value);
}

export function toBig(value: NumericValue) {
  if (value === null || value === undefined || value === "") {
    return new Big(0);
  }

  try {
    return new Big(value);
  } catch {
    return new Big(0);
  }
}

export function roundDecimal(value: NumericValue, decimals = 2) {
  return Number(
    toBig(value).round(decimals, Big.roundHalfUp).toFixed(decimals),
  );
}
