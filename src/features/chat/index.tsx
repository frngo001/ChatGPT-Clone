import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { useNavigate } from '@tanstack/react-router'
import {
  MoreVertical,
  Edit,
  Phone,
  Search as SearchIcon,
  Video,
  MessagesSquare,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import Chat from '@/components/chat/chat'
import { useChatStore } from '@/stores/chat-store'


export function ChatPage() {
  const navigate = useNavigate()
  const { chats, currentChatId, selectChat, getCurrentChat } = useChatStore()
  const [search, setSearch] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4')
  const [models] = useState<string[]>(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'llama-2'])

  // Get current chat
  const currentChat = getCurrentChat()

  // Filtered data based on the search query
  const filteredChatList = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.trim().toLowerCase())
  )

  const handleNewChat = () => {
    // Navigiere einfach zu /chat/ ohne einen neuen Chat zu erstellen
    navigate({ to: '/chat' })
  }

  const handleChatSelect = (chatId: string) => {
    selectChat(chatId)
    navigate({ to: '/chat/$id', params: { id: chatId } })
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Left Side */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='bg-background sticky top-0 z-10 -mx-4 px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>ChatGPT</h1>
                  <MessagesSquare size={20} />
                </div>

                <Button
                  size='icon'
                  variant='ghost'
                  onClick={handleNewChat}
                  className='rounded-lg'
                >
                  <Edit size={24} className='stroke-muted-foreground' />
                </Button>
              </div>

              <label
                className={cn(
                  'focus-within:ring-ring focus-within:ring-1 focus-within:outline-hidden',
                  'border-border flex h-10 w-full items-center space-x-0 rounded-md border ps-2'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>Search</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder='Search chat...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {filteredChatList.map((chat) => {
                const { id, title, messages } = chat
                const lastMessage = messages[messages.length - 1]
                const lastMsg = lastMessage 
                  ? (lastMessage.role === 'user' 
                      ? `You: ${lastMessage.content}` 
                      : lastMessage.content)
                  : 'Keine Nachrichten'
                return (
                  <Fragment key={id}>
                    <button
                      type='button'
                      className={cn(
                        'group hover:bg-accent hover:text-accent-foreground',
                        `flex w-full rounded-md px-2 py-2 text-start text-sm`,
                        currentChatId === id && 'sm:bg-muted'
                      )}
                      onClick={() => handleChatSelect(id)}
                    >
                      <div className='flex gap-2'>
                        <Avatar>
                          <AvatarImage src="" alt="Chat" />
                          <AvatarFallback>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className='col-start-2 row-span-2 font-normal text-sm'>
                            {title}
                          </span>
                          <span className='text-muted-foreground group-hover:text-accent-foreground/90 col-start-2 row-span-2 row-start-2 line-clamp-2 text-ellipsis'>
                            {lastMsg}
                          </span>
                        </div>
                      </div>
                    </button>
                    <Separator className='my-1' />
                  </Fragment>
                )
              })}
            </ScrollArea>
          </div>

          {/* Right Side - Chat Interface */}
          {currentChat ? (
            <div className='bg-background flex-1 flex-col border shadow-xs sm:rounded-md'>
              {/* Top Part */}
              <div className='bg-card mb-1 flex flex-none justify-between p-4 shadow-lg sm:rounded-t-md'>
                {/* Left */}
                <div className='flex gap-3'>
                  <div className='flex items-center gap-2 lg:gap-4'>
                    <Avatar className='size-9 lg:size-11'>
                      <AvatarImage src="" alt="Chat" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className='col-start-2 row-span-2 text-sm font-medium lg:text-base'>
                        {currentChat.title}
                      </span>
                      <span className='text-muted-foreground col-start-2 row-span-2 row-start-2 line-clamp-1 block max-w-32 text-xs text-nowrap text-ellipsis lg:max-w-none lg:text-sm'>
                        KI-Assistent
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className='-me-1 flex items-center gap-1 lg:gap-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                  >
                    <Video size={22} className='stroke-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                  >
                    <Phone size={22} className='stroke-muted-foreground' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6'
                  >
                    <MoreVertical className='stroke-muted-foreground sm:size-5' />
                  </Button>
                </div>
              </div>

              {/* Chat Component */}
              <div className='flex-1 flex flex-col'>
                <Chat
                  id={currentChat.id}
                  initialMessages={currentChat.messages}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  models={models}
                />
              </div>
            </div>
          ) : (
            <div className='bg-card flex-1 flex-col justify-center rounded-md border shadow-xs sm:flex'>
              <div className='flex flex-col items-center space-y-6'>
                <div className='border-border flex size-16 items-center justify-center rounded-full border-2'>
                  <MessagesSquare className='size-8' />
                </div>
                <div className='space-y-2 text-center'>
                  <h1 className='text-xl font-semibold'>Ihre Nachrichten</h1>
                  <p className='text-muted-foreground text-sm'>
                    Senden Sie eine Nachricht, um einen Chat zu starten.
                  </p>
                </div>
                <Button onClick={() => navigate({ to: '/chat' })}>
                  Nachricht senden
                </Button>
              </div>
            </div>
          )}
        </section>
      </Main>
    </>
  )
}
