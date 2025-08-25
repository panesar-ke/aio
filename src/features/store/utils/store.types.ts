import type { z } from 'zod';
import type { getStores } from '@/features/store/services/stores/data';
import type { storeFormSchema } from '@/features/store/utils/schema';

export type StoreCacheTags = 'stores' | 'grns' | 'material issues';

export type Store = Awaited<ReturnType<typeof getStores>>[number];
export type StoreFormValues = z.infer<typeof storeFormSchema>;
