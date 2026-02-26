import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  KeyboardAvoidingView, Platform, BackHandler,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useStudyStore } from '@/store/studyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useBlockStore } from '@/store/blockStore';
import { useQuizStore } from '@/store/quizStore';
import { getClient, generateQuestion, evaluateAnswer } from '@/api/claude';
import { AppBlockerModule } from '@/services/native/AppBlockerModule';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import StreakIndicator from '@/components/quiz/StreakIndicator';
import type { RootStackParamList } from '@/types/navigation';
import type { ChatMessage, QuizSession } from '@/types/quiz';

type QuizRoute = RouteProp<RootStackParamList, 'QuizOverlay'>;

export default function QuizOverlayScreen() {
  const route = useRoute<QuizRoute>();
  const nav = useNavigation();
  const { blockedAppPackage, blockedAppName } = route.params ?? { blockedAppPackage: '', blockedAppName: 'App' };

  const { profile } = useStudyStore();
  const { questionsNeeded, unlockDurationMin, claudeApiKey } = useSettingsStore();
  const { grantAccess } = useBlockStore();
  const {
    activeSession,
    startSession,
    addMessage,
    setCurrentQuestion,
    recordEvaluation,
    incrementStreak,
    resetStreak,
    unlockApp,
    endSession,
  } = useQuizStore();

  const listRef = useRef<FlatList>(null);
  const isLoading = useRef(false);
  const recentQuestions = useRef<string[]>([]);

  // Block hardware back button until quiz is passed
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      const session = useQuizStore.getState().activeSession;
      if (session?.isUnlocked) return false; // allow back
      return true; // block back
    });
    return () => handler.remove();
  }, []);

  // Initialize session
  useEffect(() => {
    if (!profile) return;
    const session: QuizSession = {
      id: Math.random().toString(36).slice(2),
      startedAt: Date.now(),
      blockedAppPackage,
      blockedAppName,
      messages: [],
      currentQuestion: null,
      evaluations: [],
      streak: 0,
      requiredStreak: questionsNeeded,
      isUnlocked: false,
    };
    startSession(session);
  }, []);

  // Ask first question after session starts
  useEffect(() => {
    if (activeSession && activeSession.messages.length === 0) {
      askNextQuestion(0);
    }
  }, [activeSession?.id]);

  const askNextQuestion = useCallback(async (currentStreak: number) => {
    if (!profile || isLoading.current) return;
    isLoading.current = true;

    const thinkingId = Math.random().toString(36).slice(2);
    addMessage({ id: thinkingId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true });

    try {
      const client = getClient(claudeApiKey);
      const question = await generateQuestion(client, profile, recentQuestions.current, currentStreak);
      recentQuestions.current.push(question.questionText);
      setCurrentQuestion(question);

      // Replace the streaming placeholder with actual question
      useQuizStore.setState((s) => ({
        activeSession: s.activeSession
          ? {
              ...s.activeSession,
              messages: s.activeSession.messages.map((m) =>
                m.id === thinkingId
                  ? { ...m, content: question.questionText, isStreaming: false }
                  : m
              ),
            }
          : null,
      }));
    } catch (err) {
      useQuizStore.setState((s) => ({
        activeSession: s.activeSession
          ? {
              ...s.activeSession,
              messages: s.activeSession.messages.map((m) =>
                m.id === thinkingId
                  ? { ...m, content: 'Sorry, I had trouble generating a question. Please try again.', isStreaming: false }
                  : m
              ),
            }
          : null,
      }));
    } finally {
      isLoading.current = false;
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [profile, claudeApiKey]);

  const handleSubmitAnswer = useCallback(async (userAnswerText: string) => {
    if (!profile || !activeSession?.currentQuestion || isLoading.current) return;
    isLoading.current = true;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: userAnswerText,
      timestamp: Date.now(),
    };
    addMessage(userMsg);

    const feedbackId = Math.random().toString(36).slice(2);
    addMessage({ id: feedbackId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true });

    try {
      const client = getClient(claudeApiKey);
      const evaluation = await evaluateAnswer(client, activeSession.currentQuestion, userAnswerText, profile);
      recordEvaluation(evaluation);

      const newStreak = evaluation.isCorrect
        ? activeSession.streak + 1
        : 0;

      if (evaluation.isCorrect) incrementStreak();
      else resetStreak();

      const feedbackPrefix = evaluation.isCorrect ? '✓ Correct! ' : '✗ Not quite. ';
      let feedbackContent = feedbackPrefix + evaluation.feedback;

      if (evaluation.isCorrect && newStreak >= questionsNeeded) {
        // Unlock!
        feedbackContent += `\n\n🎉 You've answered ${questionsNeeded} in a row! ${blockedAppName} is unlocked for ${unlockDurationMin} minutes.`;

        const expiresAt = Date.now() + unlockDurationMin * 60 * 1000;
        grantAccess({ packageName: blockedAppPackage, grantedAt: Date.now(), expiresAt });
        AppBlockerModule.grantAppAccess(blockedAppPackage, expiresAt);
        unlockApp();

        useQuizStore.setState((s) => ({
          activeSession: s.activeSession
            ? {
                ...s.activeSession,
                messages: s.activeSession.messages.map((m) =>
                  m.id === feedbackId ? { ...m, content: feedbackContent, isStreaming: false } : m
                ),
              }
            : null,
        }));

        setTimeout(() => {
          endSession();
          nav.goBack();
        }, 2500);
      } else {
        useQuizStore.setState((s) => ({
          activeSession: s.activeSession
            ? {
                ...s.activeSession,
                messages: s.activeSession.messages.map((m) =>
                  m.id === feedbackId ? { ...m, content: feedbackContent, isStreaming: false } : m
                ),
              }
            : null,
        }));

        // Ask next question
        setTimeout(() => askNextQuestion(newStreak), 600);
      }
    } catch (err) {
      useQuizStore.setState((s) => ({
        activeSession: s.activeSession
          ? {
              ...s.activeSession,
              messages: s.activeSession.messages.map((m) =>
                m.id === feedbackId ? { ...m, content: 'Error evaluating answer. Please try again.', isStreaming: false } : m
              ),
            }
          : null,
      }));
    } finally {
      isLoading.current = false;
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [profile, activeSession, claudeApiKey, questionsNeeded, unlockDurationMin, blockedAppPackage, blockedAppName]);

  const session = activeSession;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed" size={16} color="#FF9800" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {blockedAppName} is locked
          </Text>
        </View>
        <Text style={styles.headerSub}>Answer questions to unlock</Text>
      </View>

      {/* Streak Progress */}
      {session && (
        <StreakIndicator streak={session.streak} required={questionsNeeded} />
      )}

      {/* Chat */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={session?.messages ?? []}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
        <ChatInput
          onSend={handleSubmitAnswer}
          loading={isLoading.current}
          disabled={session?.isUnlocked}
          placeholder={session?.isUnlocked ? 'Unlocked!' : 'Type your answer...'}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    backgroundColor: '#0f0f0f',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  headerTitle: { color: '#FF9800', fontSize: 16, fontWeight: '700', flex: 1 },
  headerSub: { color: '#666', fontSize: 12 },
  listContent: { paddingVertical: 12 },
});
