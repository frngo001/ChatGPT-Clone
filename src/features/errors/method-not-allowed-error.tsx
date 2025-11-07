import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function MethodNotAllowedError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>405</h1>
        <span className='font-medium'>Methode nicht erlaubt</span>
        <p className='text-muted-foreground text-center'>
          Die angeforderte Methode ist für diese Ressource <br />
          nicht erlaubt oder nicht verfügbar.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Zurück
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>Zur Startseite</Button>
        </div>
      </div>
    </div>
  )
}

