import { fetchForms } from '@/components/layout/app-sidebar';

export default async function Home() {
  const forms = await fetchForms();
  return <pre>{JSON.stringify(forms, null, 2)}</pre>;
}
