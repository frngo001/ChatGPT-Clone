import { type ReactNode, useRef, useCallback } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useDatasetStore } from '@/stores/dataset-store'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'
import { FoldersIcon, type FoldersIconHandle } from '@/components/ui/folders-icon'
import { SquarePenIcon, type SquarePenIconHandle } from '@/components/ui/square-pen-icon'

export function NavGroupExtended({ items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup className="mt-0">
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsibleExtended key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-[10px] leading-none'>{children}</Badge>
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const squarePenIconRef = useRef<SquarePenIconHandle>(null)
  // Selektiver Store-Selektor: Nur die Funktion abonnieren, nicht den ganzen Store
  const fetchDatasetDataWithCache = useDatasetStore((state) => state.fetchDatasetDataWithCache)
  
  // ✅ Optimized: useCallback für Event-Handler um unnötige Re-Renders zu vermeiden
  const handleMouseEnter = useCallback(() => {
    if (item.icon === SquarePenIcon) {
      squarePenIconRef.current?.startAnimation()
    }
  }, [item.icon])
  
  const handleMouseLeave = useCallback(() => {
    if (item.icon === SquarePenIcon) {
      squarePenIconRef.current?.stopAnimation()
    }
  }, [item.icon])

  const handleClick = useCallback(() => {
    setOpenMobile(false)
    
    // Check if this is a dataset link
    const datasetMatch = href.match(/^\/library\/datasets\/(.+)$/)
    if (datasetMatch) {
      const datasetId = datasetMatch[1]
      // Trigger cache-fetch before navigation
      fetchDatasetDataWithCache(datasetId).catch((error) => {
        console.error('Failed to fetch dataset data:', error)
      })
    }
  }, [href, fetchDatasetDataWithCache, setOpenMobile])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link to={item.url} onClick={handleClick}>
          {item.icon === SquarePenIcon ? (
            <SquarePenIcon ref={squarePenIconRef} />
          ) : (
            item.icon && <item.icon />
          )}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsibleExtended({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { setOpenMobile } = useSidebar()
  const foldersIconRef = useRef<FoldersIconHandle>(null)
  
  // ✅ Optimized: useCallback für Event-Handler um unnötige Re-Renders zu vermeiden
  const handleMouseEnter = useCallback(() => {
    if (item.icon === FoldersIcon) {
      foldersIconRef.current?.startAnimation()
    }
  }, [item.icon])
  
  const handleMouseLeave = useCallback(() => {
    if (item.icon === FoldersIcon) {
      foldersIconRef.current?.stopAnimation()
    }
  }, [item.icon])
  
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            tooltip={item.title}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {item.icon === FoldersIcon ? (
              <FoldersIcon ref={foldersIconRef} />
            ) : (
              item.icon && <item.icon />
            )}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-[50ms] group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              // Check if subItem has its own items (nested structure)
              if ('items' in subItem && subItem.items) {
                return (
                  <Collapsible key={subItem.title} className="group/sub-collapsible">
                    <SidebarMenuSubItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton>
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.title}</span>
                          {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                          <ChevronRight className='ms-auto transition-transform duration-[50ms] group-data-[state=open]/sub-collapsible:rotate-90' />
                        </SidebarMenuSubButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4 space-y-1">
                          {('items' in subItem && subItem.items) ? subItem.items.map((nestedItem: any) => (
                            <Link
                              key={nestedItem.title}
                              to={nestedItem.url}
                              onClick={() => setOpenMobile(false)}
                              className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 transition-colors"
                            >
                              {nestedItem.icon && <nestedItem.icon className="h-4 w-4" />}
                              <span className="truncate">{nestedItem.title}</span>
                              {nestedItem.badge && <NavBadge>{nestedItem.badge}</NavBadge>}
                            </Link>
                          )) : null}
                        </div>
                      </CollapsibleContent>
                    </SidebarMenuSubItem>
                  </Collapsible>
                )
              }

              // Regular sub-item without nested items
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem as any)}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const foldersIconRef = useRef<FoldersIconHandle>(null)
  
  // ✅ Optimized: useCallback für Event-Handler um unnötige Re-Renders zu vermeiden
  const handleMouseEnter = useCallback(() => {
    if (item.icon === FoldersIcon) {
      foldersIconRef.current?.startAnimation()
    }
  }, [item.icon])
  
  const handleMouseLeave = useCallback(() => {
    if (item.icon === FoldersIcon) {
      foldersIconRef.current?.stopAnimation()
    }
  }, [item.icon])
  
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {item.icon === FoldersIcon ? (
              <FoldersIcon ref={foldersIconRef} />
            ) : (
              item.icon && <item.icon />
            )}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-[50ms] group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={`${checkIsActive(href, sub as any) ? 'bg-secondary' : ''}`}
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
