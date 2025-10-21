import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
        <span className='font-medium'>Ups! Seite nicht gefunden!</span>
        <p className='text-muted-foreground text-center'>
          Es scheint, als ob die Seite, nach der Sie suchen, <br />
          nicht existiert oder möglicherweise entfernt wurde.
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
