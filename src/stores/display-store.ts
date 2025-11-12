import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fonts } from '@/config/fonts'
import { getDefaultDarkTheme } from '@/config/dark-themes'

type Font = typeof fonts[number]

export interface State {
  showThemeSettings: boolean
  selectedFont: Font
  theme: 'light' | 'dark' | 'system'
  darkThemeId: string
}

export interface Actions {
  setShowThemeSettings: (show: boolean) => void
  setSelectedFont: (font: Font) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setDarkThemeId: (themeId: string) => void
}

export const useDisplayStore = create<State & Actions>()(
  persist(
    (set) => ({
      // Default values
      showThemeSettings: true,
      selectedFont: 'inter', // Default to Inter
      theme: 'system', // Default to system theme
      darkThemeId: getDefaultDarkTheme().id, // Default to first dark theme
      
      // Actions
      setShowThemeSettings: (showThemeSettings) => set({ showThemeSettings }),
      setSelectedFont: (selectedFont) => set({ selectedFont }),
      setTheme: (theme) => set({ theme }),
      setDarkThemeId: (darkThemeId) => set({ darkThemeId }),
    }),
    {
      name: 'display-settings-store', // unique name
      partialize: (state) => ({
        showThemeSettings: state.showThemeSettings,
        selectedFont: state.selectedFont,
        theme: state.theme,
        darkThemeId: state.darkThemeId,
      }),
    }
  )
)
