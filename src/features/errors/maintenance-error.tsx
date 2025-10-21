import { Button } from '@/components/ui/button'

export function MaintenanceError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
        <span className='font-medium'>Website befindet sich im Wartungsmodus!</span>
        <p className='text-muted-foreground text-center'>
          Die Website ist derzeit nicht verfügbar. <br />
          Wir sind bald wieder online.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline'>Mehr erfahren</Button>
        </div>
      </div>
    </div>
  )
}
