/** biome-ignore-all lint/a11y/useSemanticElements: <> */
/** biome-ignore-all lint/a11y/useFocusableInteractive: <> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <> */

import { NavBarOptions } from '@/components/layout/nav-bar-options';
import { NavbarActions } from '@/components/layout/header-actions';
import {
  getCategories,
  getProductUoms,
} from '@/features/procurement/services/products/data';

export async function AppNavbar() {
  const [categories, units] = await Promise.all([
    getCategories(),
    getProductUoms(),
  ]);
  return (
    <header className="flex h-16 bg-background sticky z-10 top-0 shrink-0 items-center gap-2 border-b p-4">
      <NavBarOptions categories={categories} units={units} />
      <NavbarActions />
    </header>
  );
}
