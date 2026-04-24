import type { Metadata } from 'next';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New Expense',
};

export default async function NewExpensePage() {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  return <div>New Expense</div>;
}
