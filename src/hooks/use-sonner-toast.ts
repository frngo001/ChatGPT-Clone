import { toast as sonnerToast } from 'sonner'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant = 'info', duration = 3000 }: ToastOptions) => {
    const message = description ? `${title}\n${description}` : title
    
    switch (variant) {
      case 'success':
        return sonnerToast.success(message, { duration })
      case 'error':
        return sonnerToast.error(message, { duration })
      case 'warning':
        return sonnerToast.warning(message, { duration })
      case 'info':
      default:
        return sonnerToast.info(message, { duration })
    }
  }

  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}
