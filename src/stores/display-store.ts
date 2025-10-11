import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fonts } from '@/config/fonts'

type Font = typeof fonts[number]

interface State {
  showThemeSettings: boolean
  selectedFont: Font
}

interface Actions {
  setShowThemeSettings: (show: boolean) => void
  setSelectedFont: (font: Font) => void
}

export const useDisplayStore = create<State & Actions>()(
  persist(
    (set) => ({
      // Default values
      showThemeSettings: true,
      selectedFont: 'inter', // Default to Inter
      
      // Actions
      setShowThemeSettings: (showThemeSettings) => set({ showThemeSettings }),
      setSelectedFont: (selectedFont) => set({ selectedFont }),
    }),
    {
      name: 'display-settings-store', // unique name
      partialize: (state) => ({
        showThemeSettings: state.showThemeSettings,
        selectedFont: state.selectedFont,
      }),
    }
  )
)
