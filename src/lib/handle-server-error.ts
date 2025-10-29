import { AxiosError } from 'axios'
import { toast } from 'sonner'

export function handleServerError(error: unknown) {

  let errMsg = 'Etwas ist schiefgelaufen!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Inhalt nicht gefunden.'
  }

  if (error instanceof AxiosError) {
    errMsg = error.response?.data.title
  }

  toast.error(errMsg)
}
