import { useEffect } from 'react'
import { useDisplayStore } from '@/stores/display-store'
import { useTheme } from '@/context/theme-provider'
import { getDarkThemeById } from '@/config/dark-themes'
import { applyDarkTheme, resetDarkTheme } from '@/lib/apply-dark-theme'

/**
 * Hook zum automatischen Anwenden des Dark-Themes, wenn Dark-Modus aktiv ist
 */
export function useDarkTheme() {
  const { resolvedTheme } = useTheme()
  const darkThemeId = useDisplayStore((state) => state.darkThemeId)

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      const darkTheme = getDarkThemeById(darkThemeId)
      if (darkTheme) {
        applyDarkTheme(darkTheme)
      }
    } else {
      resetDarkTheme()
    }
  }, [resolvedTheme, darkThemeId])
}

