import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg'
        )}
      >
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        <div className='hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors duration-[50ms] group'>
          <div className='flex items-center gap-1.5'>
            <div className='w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse'></div>
            {/* Use a more engaging, clear phrase in German */}
            <span className='text-xs font-medium text-foreground/80'>Schneller finden mit </span>
          </div>
          <kbd className='inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-background border border-border rounded shadow-sm group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-[50ms]'>
            <span className='text-[8px]'>⌘</span>K
          </kbd>
        </div>
        {children}
      </div>
    </header>
  )
}
