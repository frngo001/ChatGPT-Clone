import { ReactNode } from 'react'

type ContentSectionProps = {
  title?: string | undefined
  desc?: string | undefined
  children: ReactNode
}

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  const hasTitle = title && title.trim().length > 0
  const hasDesc = desc && desc.trim().length > 0
  
  return (
    <div className='flex flex-1 flex-col w-full h-full'>
      {(hasTitle || hasDesc) && (
        <div className='flex-none mb-4 md:mb-5'>
          {hasTitle && <h3 className='text-base md:text-lg font-semibold mb-1.5'>{title}</h3>}
          {hasDesc && <p className='text-xs text-muted-foreground leading-relaxed'>{desc}</p>}
        </div>
      )}
      <div className='flex-1 w-full overflow-hidden'>
        <div className='h-full w-full overflow-y-auto scroll-smooth pe-2 md:pe-4 pb-4 md:pb-6'>
          <div className='w-full max-w-none'>{children}</div>
        </div>
      </div>
    </div>
  )
}
