import type { RowSelectionState } from '@tanstack/react-table';

export function isSessionSelectable(
  sessionId: string,
  currentSessionId: string,
): boolean {
  return sessionId !== currentSessionId;
}

export function getRevocableSessionIds(
  rowSelection: RowSelectionState,
  currentSessionId: string,
): Array<string> {
  return Object.keys(rowSelection).filter((sessionId) =>
    isSessionSelectable(sessionId, currentSessionId),
  );
}
