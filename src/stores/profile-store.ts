import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './auth-store'

interface ProfileData {
  username: string
  email: string
}

interface State {
  profileData: ProfileData
}

interface Actions {
  updateProfileData: (data: Partial<ProfileData>) => void
  resetProfileData: () => void
  getCurrentUserEmail: () => string
  getCurrentUserData: () => ProfileData
}

const defaultProfileData: ProfileData = {
  username: '',
  email: '', // Will be set from authenticated user
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
      getCurrentUserEmail: () => {
        const authStore = useAuthStore.getState();
        return authStore.auth.user?.email || '';
      },
      getCurrentUserData: () => {
        const authStore = useAuthStore.getState();
        const user = authStore.auth.user;
        return {
          username: user?.email?.split('@')[0] || '',
          email: user?.email || '',
        };
      },
    }),
    {
      name: 'profile-settings-store', // unique name
      partialize: (state) => ({
        profileData: state.profileData,
      }),
    }
  )
)
