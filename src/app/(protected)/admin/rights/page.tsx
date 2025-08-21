import { RightsForm } from '@/features/admin/components/rights/rights-form';

export const metadata = {
  title: 'User rights',
};

export default async function UserRightsPage() {
  return (
    <div className="space-y-6">
      <RightsForm />
    </div>
  );
}
