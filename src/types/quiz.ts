export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  targetConcept: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  generatedAt: number;
}

export interface QuizEvaluation {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  confidence: 'clear' | 'partial' | 'incorrect';
  feedback: string;
}

export interface QuizSession {
  id: string;
  startedAt: number;
  blockedAppPackage: string;
  blockedAppName: string;
  messages: ChatMessage[];
  currentQuestion: QuizQuestion | null;
  evaluations: QuizEvaluation[];
  streak: number;
  requiredStreak: number;
  isUnlocked: boolean;
  unlockedAt?: number;
}
