const NEXT_HTTP_ERROR_FALLBACK = 'NEXT_HTTP_ERROR_FALLBACK';
const NOT_FOUND_STATUS = 404;

type NextHttpError = {
  digest: string;
};

export function isNextNotFoundError(error: unknown): error is NextHttpError {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('digest' in error) ||
    typeof error.digest !== 'string'
  ) {
    return false;
  }

  const [prefix, status] = error.digest.split(';');
  return prefix === NEXT_HTTP_ERROR_FALLBACK && Number(status) === NOT_FOUND_STATUS;
}

export function rethrowIfNextNotFoundError(error: unknown) {
  if (isNextNotFoundError(error)) {
    throw error;
  }
}
