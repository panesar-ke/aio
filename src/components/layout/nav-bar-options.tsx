'use client';

import { usePathname } from 'next/navigation';
import {
  BlocksIcon,
  ChevronsUpDownIcon,
  DrillIcon,
  ListTreeIcon,
  ShoppingBasketIcon,
  User2Icon,
} from 'lucide-react';
import type { Option } from '@/types/index.types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModal } from '@/features/integrations/modal-provider';
import CustomModal from '@/components/custom/custom-modal';
import { ProductsForm } from '@/features/procurement/components/products/products-form';
import { ServiceForm } from '@/features/procurement/components/services/service-form';
import { VendorForm } from '@/features/procurement/components/vendors/vendor-form';
import { ProjectForm } from '@/features/procurement/components/project/project-form';
import { CategoriesForm } from '@/features/it/components/expenses/categories';
import { SubCategoriesForm } from '@/features/it/components/expenses/sub-categories';
import { PermissionGate } from '@/components/auth/client-permission-gate';

export function NavBarOptions({
  categories,
  units,
}: {
  categories: Array<Option>;
  units: Array<Option>;
}) {
  const pathName = usePathname();

  if (!pathName.startsWith('/procurement') && !pathName.startsWith('/it'))
    return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="shadow-none w-56 flex items-center justify-between focus-visible:ring-0 px-2"
        >
          <span>Options</span>
          <ChevronsUpDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 *:cursor-pointer *:font-medium">
        {pathName.startsWith('/procurement') && (
          <ProcurementOptions categories={categories} units={units} />
        )}
        {pathName.startsWith('/it') && (
          <PermissionGate permissions={['it:admin']}>
            <ITOptions />
          </PermissionGate>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProcurementOptions({
  categories,
  units,
}: {
  categories: Array<Option>;
  units: Array<Option>;
}) {
  const { setOpen } = useModal();
  function handleCreateProject() {
    setOpen(
      <CustomModal title="Create Project">
        <ProjectForm />
      </CustomModal>,
    );
  }
  function handleCreateService() {
    setOpen(
      <CustomModal title="Create Service">
        <ServiceForm fromModal />
      </CustomModal>,
    );
  }

  function handleCreateVendor() {
    setOpen(
      <CustomModal title="Create Vendor" className="md:max-w-2xl w-full">
        <VendorForm fromModal />
      </CustomModal>,
    );
  }
  function handleCreateProduct() {
    setOpen(
      <CustomModal title="Create Product" className="md:max-w-2xl w-full">
        <ProductsForm fromModal categories={categories} units={units} />
      </CustomModal>,
    );
  }

  return (
    <>
      <DropdownMenuItem onClick={handleCreateProject}>
        <BlocksIcon className="size-4" />
        <span>Create Project</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleCreateProduct}>
        <ShoppingBasketIcon className="size-4" />
        <span>Create Product</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleCreateService}>
        <DrillIcon className="size-4" />
        <span>Create Service</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleCreateVendor}>
        <User2Icon className="size-4" />
        <span>Create Vendor</span>
      </DropdownMenuItem>
    </>
  );
}

function ITOptions() {
  const { setOpen } = useModal();
  function handleCreateCategory() {
    setOpen(
      <CustomModal
        title="Create Category"
        subtitle="Manage IT Expenses Categories"
      >
        <CategoriesForm />
      </CustomModal>,
    );
  }
  function handleCreateSubCategory() {
    setOpen(
      <CustomModal
        title="Create Sub Category"
        subtitle="Manage IT Expenses Sub-Categories"
      >
        <SubCategoriesForm />
      </CustomModal>,
    );
  }
  return (
    <>
      <DropdownMenuItem onClick={handleCreateCategory}>
        <BlocksIcon className="size-4" />
        <span>Create Category</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleCreateSubCategory}>
        <ListTreeIcon className="size-4" />
        <span>Create Sub Category</span>
      </DropdownMenuItem>
    </>
  );
}
