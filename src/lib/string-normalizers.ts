export const normalizeString = (value: string) => value.trim();

export const normalizeNullableString = (value: string | null | undefined) => {
  if (value == null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue === '' ? null : normalizedValue;
};
