import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StudyProfile } from '@/types/study';
import type { ChatMessage } from '@/types/quiz';

interface StudyState {
  profile: StudyProfile | null;
  onboardingMessages: ChatMessage[];
  isAnalyzing: boolean;
  analysisError: string | null;
  pendingPdfBase64: string | null;
  pendingPdfName: string | null;

  setProfile: (profile: StudyProfile) => void;
  updateProfile: (updates: Partial<StudyProfile>) => void;
  clearProfile: () => void;
  setOnboardingMessages: (msgs: ChatMessage[]) => void;
  addOnboardingMessage: (msg: ChatMessage) => void;
  setAnalyzing: (v: boolean) => void;
  setAnalysisError: (err: string | null) => void;
  setPendingPdf: (base64: string, name: string) => void;
  clearPendingPdf: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      profile: null,
      onboardingMessages: [],
      isAnalyzing: false,
      analysisError: null,
      pendingPdfBase64: null,
      pendingPdfName: null,

      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...updates } : null })),
      clearProfile: () => set({ profile: null, onboardingMessages: [] }),
      setOnboardingMessages: (msgs) => set({ onboardingMessages: msgs }),
      addOnboardingMessage: (msg) =>
        set((s) => ({ onboardingMessages: [...s.onboardingMessages, msg] })),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setAnalysisError: (err) => set({ analysisError: err }),
      setPendingPdf: (base64, name) =>
        set({ pendingPdfBase64: base64, pendingPdfName: name }),
      clearPendingPdf: () =>
        set({ pendingPdfBase64: null, pendingPdfName: null }),
    }),
    {
      name: 'study-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        onboardingMessages: state.onboardingMessages,
      }),
    }
  )
);
