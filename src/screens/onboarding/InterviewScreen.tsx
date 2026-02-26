import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStudyStore } from '@/store/studyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getClient, sendOnboardingMessage } from '@/api/claude';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import type { OnboardingStackParamList } from '@/types/navigation';
import type { ChatMessage } from '@/types/quiz';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Interview'>;

export default function InterviewScreen() {
  const nav = useNavigation<Nav>();
  const { profile, onboardingMessages, addOnboardingMessage, setOnboardingMessages, updateProfile } = useStudyStore();
  const { claudeApiKey } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const startInterview = async () => {
    if (!profile || onboardingMessages.length > 0) return;
    setLoading(true);
    try {
      const client = getClient(claudeApiKey);
      const { text } = await sendOnboardingMessage(client, [], profile.rawMaterialSummary);
      const msg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      addOnboardingMessage(msg);
    } catch (err) {
      console.error('Interview start failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { startInterview(); }, []);

  const handleSend = async (text: string) => {
    if (!profile) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addOnboardingMessage(userMsg);
    setLoading(true);

    try {
      const client = getClient(claudeApiKey);
      const allMessages = [...onboardingMessages, userMsg];
      const history = allMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const { text: reply, profileData } = await sendOnboardingMessage(client, history, profile.rawMaterialSummary);

      if (reply) {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        };
        addOnboardingMessage(assistantMsg);
      }

      if (profileData) {
        updateProfile({
          weakAreas: profileData.weakAreas,
          studyGoals: profileData.studyGoals,
        });
        setTimeout(() => nav.navigate('ConfirmProfile'), 1200);
      }
    } catch (err) {
      console.error('Interview message failed:', err);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Interview</Text>
        <Text style={styles.headerSub}>Help Claude understand what you want to learn</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={onboardingMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
        <ChatInput onSend={handleSend} loading={loading} placeholder="Tell Claude about your goals..." />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#666', fontSize: 13, marginTop: 2 },
  listContent: { paddingVertical: 12 },
});
