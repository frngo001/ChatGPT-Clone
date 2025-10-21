import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function UnauthorisedError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>401</h1>
        <span className='font-medium'>Unbefugter Zugriff</span>
        <p className='text-muted-foreground text-center'>
          Bitte melden Sie sich mit den entsprechenden Anmeldedaten <br /> an, um auf diese Ressource zuzugreifen.
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
