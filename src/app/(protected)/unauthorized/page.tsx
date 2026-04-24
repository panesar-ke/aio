import { Unauthorized } from '@/components/auth/unauthorized';

export const metadata = {
  title: 'Unauthorized',
};

export default function UnauthorizedPage() {
  return <Unauthorized />;
}
