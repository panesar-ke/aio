import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/layout/logo";
import { generateRandomString } from "@/lib/utils";
import { Navigation } from "@/components/layout/navigation";
import { getUserForms } from "@/features/admin/services/data";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import {
  ArrowLeftRightIcon,
  AwardIcon,
  BadgeIcon,
  BanknoteArrowDownIcon,
  CircleGaugeIcon,
  ClipboardListIcon,
  FileIcon,
  FileTextIcon,
  ListCheckIcon,
  ListTreeIcon,
  LucideIcon,
  PackageIcon,
  ReceiptIcon,
  RecycleIcon,
  ShieldAlertIcon,
  TabletSmartphoneIcon,
  Users2,
  Users2Icon,
  WarehouseIcon,
  WrenchIcon,
} from "lucide-react";
import type { Route } from "next";
import type { Permission } from "@/lib/permissions/catalog";
import { getCurrentUserPermissions } from "@/lib/permissions/service";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getCurrentUser();
  const forms = await getUserForms(user.id, user.userType);
  const permissions = await getCurrentUserPermissions();
  const navItems = NAV_ITEMS.filter((item) =>
    item.permissions.some((permission) => permissions.has(permission)),
  );
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavItems items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {Array.from({ length: 5 }).map(() => (
            <SidebarMenuItem key={generateRandomString(5)}>
              <SidebarMenuButton>
                <Skeleton className="size-4" />
                <Skeleton className="w-56 h-4" />
                <Skeleton className="size-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type NavItem = {
  title: string;
  items: {
    icon: LucideIcon;
    label: string;
    href: Route;
  }[];
  permissions: Array<Permission>;
};
const NAV_ITEMS: NavItem[] = [
  {
    title: "Admin",
    items: [
      { icon: Users2, label: "Users", href: "/admin/users" },
      { icon: ListTreeIcon, label: "User Rights", href: "/admin/rights" },
    ],
    permissions: ["admin:admin"],
  },
  {
    title: "Procurement",
    items: [
      {
        label: "Dashboard",
        href: "/procurement",
        icon: CircleGaugeIcon,
      },
      {
        label: "Material Requisitions",
        href: "/procurement/material-requisition",
        icon: ClipboardListIcon,
      },
      {
        label: "Purchase Orders",
        href: "/procurement/purchase-order",
        icon: ListCheckIcon,
      },
      {
        label: "Vendors",
        href: "/procurement/vendors",
        icon: Users2Icon,
      },
      {
        label: "Products",
        href: "/procurement/products",
        icon: PackageIcon,
      },
      {
        label: "Services",
        href: "/procurement/services",
        icon: WrenchIcon,
      },
      {
        label: "PO Register",
        href: "/procurement/order-register",
        icon: FileIcon,
      },
      {
        label: "Purchase By Product/Project",
        href: "/procurement/order-by-criteria",
        icon: FileTextIcon,
      },
      {
        label: "Top Vendors",
        href: "/procurement/top-vendors",
        icon: AwardIcon,
      },
    ],
    permissions: ["procurement:admin", "procurement:standard"],
  },
  {
    title: "Stores",
    permissions: ["store:admin", "store:standard"],
    items: [
      {
        label: "Stores",
        href: "/store/stores",
        icon: WarehouseIcon,
      },
      {
        label: "Goods Received Note",
        href: "/store/grn",
        icon: ReceiptIcon,
      },
      {
        label: "Material Transfer",
        href: "/store/transfers",
        icon: ArrowLeftRightIcon,
      },
      {
        label: "Material Conversion",
        href: "/store/conversion",
        icon: RecycleIcon,
      },
    ],
  },
  {
    title: "IT",
    permissions: ["it:admin", "it:standard"],
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: CircleGaugeIcon,
      },
      {
        label: "Expenses & Budgeting",
        href: "/it/expenses-budgeting",
        icon: BanknoteArrowDownIcon,
      },
      {
        label: "Assets Management",
        href: "/it/assets",
        icon: TabletSmartphoneIcon,
      },
      {
        label: "Licenses",
        href: "/it/licenses",
        icon: BadgeIcon,
      },
    ],
  },
];

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((item, index) => (
        <SidebarGroup
          key={index}
          className="group-data-[collapsible=icon]:hidden"
        >
          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
          {item.items.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild>
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  <span className="text-[12px] font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarGroup>
      ))}
    </>
  );
}
//logout action
// async function handleLogout() {
//   await logoutAction();
// }
