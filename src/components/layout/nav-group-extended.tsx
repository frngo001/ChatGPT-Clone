import { useRef, useCallback } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, Folder, FolderOpen, FolderSearch, FolderSearch2 } from 'lucide-react'
import { useDatasetStore } from '@/stores/dataset-store'
import useOllamaChatStore from '@/stores/ollama-chat-store'
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

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const squarePenIconRef = useRef<SquarePenIconHandle>(null)
  const isNavigatingRef = useRef(false)
  // Selektiver Store-Selektor: Nur die Funktion abonnieren, nicht den ganzen Store
  const fetchDatasetDataWithCache = useDatasetStore((state) => state.fetchDatasetDataWithCache)

  const isNewChatButton = item.url === '/chat'
  const chats = useOllamaChatStore((state) => isNewChatButton ? state.chats : null)
  
  // Prüfe ob "Neuer Chat" Button und ob er deaktiviert werden soll
  const currentPath = href.split('?')[0]
  
  // Button-Logik:
  // 1. Wenn auf /chat (Index) -> deaktiviert (neuer Chat ohne Nachrichten)
  // 2. Wenn auf /chat/{chatId} -> nur aktiv wenn Chat mindestens 1 Nachricht hat
  let isDisabled = false
  if (isNewChatButton) {
    if (currentPath === '/chat') {
      // Bereits auf neuem Chat ohne ID
      isDisabled = true
    } else if (currentPath.startsWith('/chat/')) {
      // Auf einem bestehenden Chat - prüfe ob Nachrichten vorhanden
      const chatIdMatch = currentPath.match(/^\/chat\/(.+)$/)
      if (chatIdMatch) {
        const chatId = chatIdMatch[1]
        const messages = chats?.[chatId]?.messages || []
        // Deaktiviere Button wenn keine Nachrichten vorhanden
        isDisabled = !messages || messages.length === 0
      }
    }
  }
  
  // ✅ Optimized: useCallback für Event-Handler um unnötige Re-Renders zu vermeiden
  // Handler direkt auf dem Link platzieren, nicht auf dem Button, um Ref-Konflikte zu vermeiden
  const handleMouseEnter = useCallback(() => {
    // Verhindere Animation während Navigation, um Ref-Konflikte zu vermeiden
    if (isNavigatingRef.current) return
    if (item.icon === SquarePenIcon) {
      squarePenIconRef.current?.startAnimation()
    }
  }, [item.icon])
  
  const handleMouseLeave = useCallback(() => {
    // Verhindere Animation während Navigation, um Ref-Konflikte zu vermeiden
    if (isNavigatingRef.current) return
    if (item.icon === SquarePenIcon) {
      squarePenIconRef.current?.stopAnimation()
    }
  }, [item.icon])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prüfe ob "Neuer Chat" Button und ob Navigation erlaubt ist
    if (item.url === '/chat') {
      const currentPath = href.split('?')[0]
      
      // Nur verhindern wenn bereits auf /chat (ohne ID)
      if (currentPath === '/chat') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      
      // Wenn auf /chat/{chatId}, prüfe ob Nachrichten vorhanden
      if (currentPath.startsWith('/chat/')) {
        const chatIdMatch = currentPath.match(/^\/chat\/(.+)$/)
        if (chatIdMatch) {
          const chatId = chatIdMatch[1]
          const messages = chats?.[chatId]?.messages || []
          // Verhindere Navigation wenn keine Nachrichten vorhanden
          if (!messages || messages.length === 0) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
        }
      }
    }
    
    // Markiere Navigation als aktiv, um State-Updates während der Navigation zu verhindern
    isNavigatingRef.current = true
    
    // Check if this is a dataset link (nur für Dataset-Links, nicht für Chat-Links)
    // Dies verhindert unnötige API-Calls für Chat-Navigation
    if (item.url?.startsWith('/library/datasets/')) {
      const datasetMatch = href.match(/^\/library\/datasets\/(.+)$/)
      if (datasetMatch) {
        const datasetId = datasetMatch[1]
        // Trigger cache-fetch before navigation (nicht-blockierend)
        fetchDatasetDataWithCache(datasetId).catch((error) => {
          console.error('Failed to fetch dataset data:', error)
        })
      }
    }
    
    // Verzögere State-Updates, um Ref-Konflikte während der Navigation zu vermeiden
    // Verwende setTimeout mit größerer Verzögerung, um sicherzustellen,
    // dass State-Updates nach der Navigation stattfinden, nicht während des Render-Zyklus
    setTimeout(() => {
      setOpenMobile(false)
      // Reset navigation flag nach Navigation
      isNavigatingRef.current = false
    }, 200)
  }, [item.url, href, fetchDatasetDataWithCache, setOpenMobile, chats])

  // Für "Neuer Chat" Button: Mouse-Handler deaktivieren, um Ref-Konflikte zu vermeiden
  const mouseHandlers = isNewChatButton ? {} : {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
        disabled={isDisabled}
      >
        <Link 
          to={item.url} 
          onClick={handleClick}
          {...mouseHandlers}
        >
          {item.icon === SquarePenIcon ? (
            <SquarePenIcon ref={isNewChatButton ? undefined : squarePenIconRef} />
          ) : (
            item.icon && <item.icon />
          )}
          <span>{item.title}</span>
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
  
  //  Optimized: useCallback für Event-Handler um unnötige Re-Renders zu vermeiden
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
                          <ChevronRight className='ms-auto transition-transform duration-[50ms] group-data-[state=open]/sub-collapsible:rotate-90' />
                        </SidebarMenuSubButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4 space-y-1">
                          {('items' in subItem && subItem.items) ? subItem.items.map((nestedItem: any) => {
                            // Dynamisches Icon für Dataset-Items: FolderOpen wenn aktiv, Folder wenn nicht aktiv
                            const isActive = nestedItem.url && (href === nestedItem.url || href.split('?')[0] === nestedItem.url)
                            
                            // Prüfe ob es ein Dataset-Item ist (URL enthält /library/datasets/ aber nicht /library/datasets ohne ID)
                            const isDatasetItem = nestedItem.url && typeof nestedItem.url === 'string' && 
                                                  nestedItem.url.includes('/library/datasets/') && 
                                                  nestedItem.url !== '/library/datasets'
                            
                            return (
                              <Link
                                key={nestedItem.title}
                                to={nestedItem.url}
                                onClick={() => setOpenMobile(false)}
                                className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded hover:bg-muted/50 transition-colors"
                              >
                                {isDatasetItem ? (
                                  <div className="relative size-4 shrink-0">
                                    <Folder 
                                      className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                                        isActive ? 'opacity-0' : 'opacity-100'
                                      }`}
                                    />
                                    <FolderOpen 
                                      className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                                        isActive ? 'opacity-100' : 'opacity-0'
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  nestedItem.icon && <nestedItem.icon className="h-4 w-4" />
                                )}
                                <span className="truncate">{nestedItem.title}</span>
                              </Link>
                            )
                          }) : null}
                        </div>
                      </CollapsibleContent>
                    </SidebarMenuSubItem>
                  </Collapsible>
                )
              }

              // Regular sub-item without nested items
              // Dynamisches Icon für Dataset-Items: FolderOpen wenn aktiv, Folder wenn nicht aktiv
              const isActive = subItem.url && (href === subItem.url || href.split('?')[0] === subItem.url)
              
              // Prüfe ob es ein Dataset-Item ist (URL enthält /library/datasets/ aber nicht /library/datasets ohne ID)
              const isDatasetItem = subItem.url && typeof subItem.url === 'string' && 
                                    subItem.url.includes('/library/datasets/') && 
                                    subItem.url !== '/library/datasets'
              
              // Prüfe ob es der "Verwalten" Button ist
              const isVerwaltenButton = subItem.url === '/library/datasets'
              
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem as any)}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                      {isDatasetItem ? (
                        <div className="relative size-4 shrink-0">
                          <Folder 
                            className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                              isActive ? 'opacity-0' : 'opacity-100'
                            }`}
                          />
                          <FolderOpen 
                            className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        </div>
                      ) : isVerwaltenButton ? (
                        <div className="relative size-4 shrink-0">
                          <FolderSearch2 
                            className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                              isActive ? 'opacity-0' : 'opacity-100'
                            }`}
                          />
                          <FolderSearch 
                            className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        </div>
                      ) : (
                        subItem.icon && <subItem.icon />
                      )}
                      <span>{subItem.title}</span>
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
            <ChevronRight className='ms-auto transition-transform duration-[50ms] group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => {
            // Dynamisches Icon für Dataset-Items: FolderOpen wenn aktiv, Folder wenn nicht aktiv
            const isActive = sub.url && (href === sub.url || href.split('?')[0] === sub.url)
            
            // Prüfe ob es ein Dataset-Item ist (URL enthält /library/datasets/ aber nicht /library/datasets ohne ID)
            const isDatasetItem = sub.url && typeof sub.url === 'string' && 
                                  sub.url.includes('/library/datasets/') && 
                                  sub.url !== '/library/datasets'
            
            // Prüfe ob es der "Verwalten" Button ist
            const isVerwaltenButton = sub.url === '/library/datasets'
            
            return (
              <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                <Link
                  to={sub.url}
                  className={`${checkIsActive(href, sub as any) ? 'bg-secondary' : ''}`}
                >
                  {isDatasetItem ? (
                    <div className="relative size-4 shrink-0">
                      <Folder 
                        className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                          isActive ? 'opacity-0' : 'opacity-100'
                        }`}
                      />
                      <FolderOpen 
                        className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </div>
                  ) : isVerwaltenButton ? (
                    <div className="relative size-4 shrink-0">
                      <FolderSearch2 
                        className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                          isActive ? 'opacity-0' : 'opacity-100'
                        }`}
                      />
                      <FolderSearch 
                        className={`absolute inset-0 size-4 transition-opacity duration-300 ease-in-out ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </div>
                  ) : (
                    sub.icon && <sub.icon />
                  )}
                  <span className='max-w-52 text-wrap'>{sub.title}</span>
                </Link>
              </DropdownMenuItem>
            )
          })}
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
