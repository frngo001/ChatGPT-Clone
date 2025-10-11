import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AccountData {
  name: string
  dob: Date | null
  language: string
}

interface State {
  accountData: AccountData
}

interface Actions {
  updateAccountData: (data: Partial<AccountData>) => void
  resetAccountData: () => void
}

const defaultAccountData: AccountData = {
  name: '',
  dob: null,
  language: 'de', // Default to German
}

export const useAccountStore = create<State & Actions>()(
  persist(
    (set) => ({
      accountData: defaultAccountData,
      updateAccountData: (data) =>
        set((state) => ({
          accountData: { ...state.accountData, ...data },
        })),
      resetAccountData: () => set({ accountData: defaultAccountData }),
    }),
    {
      name: 'account-settings-store', // unique name
      partialize: (state) => ({
        accountData: state.accountData,
      }),
    }
  )
)
