type ContentSectionProps = {
  title: string
  desc: string
  children: React.JSX.Element
}

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div className='flex flex-1 flex-col w-full h-full'>
      <div className='flex-none mb-4 md:mb-5'>
        <h3 className='text-base md:text-lg font-semibold mb-1.5'>{title}</h3>
        <p className='text-xs text-muted-foreground leading-relaxed'>{desc}</p>
      </div>
      <div className='flex-1 w-full overflow-hidden'>
        <div className='h-full w-full overflow-y-auto scroll-smooth pe-2 md:pe-4 pb-4 md:pb-6'>
          <div className='w-full max-w-none'>{children}</div>
        </div>
      </div>
    </div>
  )
}
