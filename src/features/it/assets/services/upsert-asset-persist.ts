export type AssetUpsertOperation = 'created' | 'updated';

export type PersistAssetUpsertResult =
  | { error: false; id: string; operation: AssetUpsertOperation }
  | { error: true; message: string };

type PersistAssetUpsertArgs<Payload> = {
  id?: string | null;
  payload: Payload;
  createdBy: string;
  insert: (args: { payload: Payload; createdBy: string }) => Promise<{ id: string }>;
  update: (args: {
    id: string;
    payload: Payload;
  }) => Promise<{ id: string } | null>;
};

export async function persistAssetUpsert<Payload>(
  args: PersistAssetUpsertArgs<Payload>,
): Promise<PersistAssetUpsertResult> {
  const { id, payload, createdBy, insert, update } = args;

  if (id) {
    const updated = await update({ id, payload });
    if (!updated) {
      return { error: true, message: 'Asset not found.' };
    }

    return { error: false, id: updated.id, operation: 'updated' };
  }

  const inserted = await insert({ payload, createdBy });
  return { error: false, id: inserted.id, operation: 'created' };
}

