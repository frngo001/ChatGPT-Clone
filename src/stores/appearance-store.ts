import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppearanceData {
  font: string
  theme: string
}

interface State {
  appearanceData: AppearanceData
}

interface Actions {
  updateAppearanceData: (data: Partial<AppearanceData>) => void
  resetAppearanceData: () => void
}

const defaultAppearanceData: AppearanceData = {
  font: 'inter',
  theme: 'system',
}

export const useAppearanceStore = create<State & Actions>()(
  persist(
    (set) => ({
      appearanceData: defaultAppearanceData,
      updateAppearanceData: (data) =>
        set((state) => ({
          appearanceData: { ...state.appearanceData, ...data },
        })),
      resetAppearanceData: () => set({ appearanceData: defaultAppearanceData }),
    }),
    {
      name: 'appearance-settings-store', // unique name
      partialize: (state) => ({
        appearanceData: state.appearanceData,
      }),
    }
  )
)
