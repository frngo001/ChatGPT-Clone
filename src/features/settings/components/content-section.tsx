type ContentSectionProps = {
  title: string
  desc: string
  children: React.JSX.Element
}

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div className='flex flex-1 flex-col w-full'>
      <div className='flex-none'>
        <h3 className='text-lg md:text-base font-medium'>{title}</h3>
        <p className='text-sm md:text-xs text-muted-foreground'>{desc}</p>
      </div>
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-2 md:pe-1.5 pb-10 md:pb-8 mt-4 md:mt-3'>
        <div className='-mx-1 px-1.5 w-full max-w-none'>{children}</div>
      </div>
    </div>
  )
}
