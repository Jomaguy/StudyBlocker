import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  questionsNeeded: number;
  unlockDurationMin: number;
  claudeApiKey: string;

  setQuestionsNeeded: (n: number) => void;
  setUnlockDurationMin: (m: number) => void;
  setClaudeApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      questionsNeeded: 3,
      unlockDurationMin: 30,
      claudeApiKey: '',

      setQuestionsNeeded: (n) => set({ questionsNeeded: n }),
      setUnlockDurationMin: (m) => set({ unlockDurationMin: m }),
      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
