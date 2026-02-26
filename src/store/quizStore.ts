import { create } from 'zustand';
import type { QuizSession, ChatMessage, QuizEvaluation, QuizQuestion } from '@/types/quiz';

interface QuizState {
  activeSession: QuizSession | null;
  sessionHistory: QuizSession[];

  startSession: (session: QuizSession) => void;
  addMessage: (msg: ChatMessage) => void;
  updateStreamingMessage: (id: string, content: string) => void;
  finalizeStreamingMessage: (id: string) => void;
  setCurrentQuestion: (q: QuizQuestion | null) => void;
  recordEvaluation: (ev: QuizEvaluation) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  unlockApp: () => void;
  endSession: () => void;
}

export const useQuizStore = create<QuizState>()((set) => ({
  activeSession: null,
  sessionHistory: [],

  startSession: (session) => set({ activeSession: session }),

  addMessage: (msg) =>
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, messages: [...s.activeSession.messages, msg] }
        : null,
    })),

  updateStreamingMessage: (id, content) =>
    set((s) => ({
      activeSession: s.activeSession
        ? {
            ...s.activeSession,
            messages: s.activeSession.messages.map((m) =>
              m.id === id ? { ...m, content } : m
            ),
          }
        : null,
    })),

  finalizeStreamingMessage: (id) =>
    set((s) => ({
      activeSession: s.activeSession
        ? {
            ...s.activeSession,
            messages: s.activeSession.messages.map((m) =>
              m.id === id ? { ...m, isStreaming: false } : m
            ),
          }
        : null,
    })),

  setCurrentQuestion: (q) =>
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, currentQuestion: q }
        : null,
    })),

  recordEvaluation: (ev) =>
    set((s) => ({
      activeSession: s.activeSession
        ? {
            ...s.activeSession,
            evaluations: [...s.activeSession.evaluations, ev],
          }
        : null,
    })),

  incrementStreak: () =>
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, streak: s.activeSession.streak + 1 }
        : null,
    })),

  resetStreak: () =>
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, streak: 0 }
        : null,
    })),

  unlockApp: () =>
    set((s) => ({
      activeSession: s.activeSession
        ? { ...s.activeSession, isUnlocked: true, unlockedAt: Date.now() }
        : null,
    })),

  endSession: () =>
    set((s) => ({
      activeSession: null,
      sessionHistory: s.activeSession
        ? [...s.sessionHistory, s.activeSession]
        : s.sessionHistory,
    })),
}));
