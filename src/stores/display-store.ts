import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fonts } from '@/config/fonts'

type Font = typeof fonts[number]

interface State {
  showThemeSettings: boolean
  selectedFont: Font
  theme: 'light' | 'dark' | 'system'
}

interface Actions {
  setShowThemeSettings: (show: boolean) => void
  setSelectedFont: (font: Font) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useDisplayStore = create<State & Actions>()(
  persist(
    (set) => ({
      // Default values
      showThemeSettings: true,
      selectedFont: 'inter', // Default to Inter
      theme: 'system', // Default to system theme
      
      // Actions
      setShowThemeSettings: (showThemeSettings) => set({ showThemeSettings }),
      setSelectedFont: (selectedFont) => set({ selectedFont }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'display-settings-store', // unique name
      partialize: (state) => ({
        showThemeSettings: state.showThemeSettings,
        selectedFont: state.selectedFont,
        theme: state.theme,
      }),
    }
  )
)
