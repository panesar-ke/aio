import { Link } from '@tanstack/react-router'
import {
  Armchair,
  CircleGauge,
  DollarSign,
  HandCoins,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Form, TRoutes } from '@/types/index.types'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface FormattedArray {
  title: string
  url: string
  icon: LucideIcon
  items: Array<{
    title: string
    url: string
  }>
}

const icons = {
  admin: ShieldCheck,
  procurement: ShoppingBag,
  store: Store,
  'human resources': Users,
  sales: HandCoins,
  accounts: DollarSign,
  logistics: CircleGauge,
  site: Armchair,
} as const

type IconKeys = keyof typeof icons

export function Navigation({ forms }: { forms: Array<Form> }) {
  const groupedModules = forms.reduce<
    Record<string, Array<{ title: string; url: string }>>
  >((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[curr.module]) {
      acc[curr.module] = []
    }
    acc[curr.module].push({ title: curr.formName, url: curr.path })
    return acc
  }, {})

  function isIconKey(module: string): module is IconKeys {
    return module in icons
  }

  const formattedArray: Array<FormattedArray> = Object.entries(
    groupedModules,
  ).map(([module, items]) => ({
    title: module,
    url: '#',
    icon: isIconKey(module) ? icons[module] : ShieldCheck,
    items,
  }))
  return (
    <SidebarGroup>
      <SidebarMenu>
        {formattedArray.map((item) => (
          <Collapsible key={item.title} asChild className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="capitalize" tooltip={item.title}>
                  {<item.icon />}
                  <span>{item.title}</span>
                  <Plus className="ml-auto icon text-muted-foreground group-data-[state=open]/collapsible:hidden" />
                  <Minus className="hidden ml-auto icon text-muted-foreground group-data-[state=open]/collapsible:block" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        className="text-xs font-medium text-muted-foreground"
                      >
                        <Link
                          to={`/${subItem.url}` as TRoutes}
                          className="capitalize"
                        >
                          {subItem.title}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
