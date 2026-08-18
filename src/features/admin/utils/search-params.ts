import { createLoader, parseAsString } from 'nuqs/server';

export const activeSessionsSearchParams = {
  search: parseAsString.withDefault(''),
};

export const loadActiveSessionsSearchParams = createLoader(
  activeSessionsSearchParams,
);
