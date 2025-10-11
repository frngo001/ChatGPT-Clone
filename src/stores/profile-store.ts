import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileData {
  username: string
  email: string
  urls: Array<{ value: string }>
}

interface State {
  profileData: ProfileData
}

interface Actions {
  updateProfileData: (data: Partial<ProfileData>) => void
  resetProfileData: () => void
}

const defaultProfileData: ProfileData = {
  username: '',
  email: 'm@example.com', // Default email
  urls: [],
}

export const useProfileStore = create<State & Actions>()(
  persist(
    (set) => ({
      profileData: defaultProfileData,
      updateProfileData: (data) =>
        set((state) => ({
          profileData: { ...state.profileData, ...data },
        })),
      resetProfileData: () => set({ profileData: defaultProfileData }),
    }),
    {
      name: 'profile-settings-store', // unique name
      partialize: (state) => ({
        profileData: state.profileData,
      }),
    }
  )
)
