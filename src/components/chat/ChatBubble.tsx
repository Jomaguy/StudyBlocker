import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { ChatMessage } from '@/types/quiz';

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.container, isAssistant ? styles.assistantContainer : styles.userContainer]}>
      <View style={[styles.bubble, isAssistant ? styles.assistantBubble : styles.userBubble]}>
        {message.isStreaming && message.content === '' ? (
          <ActivityIndicator size="small" color="#6C63FF" />
        ) : (
          <Text style={[styles.text, isAssistant ? styles.assistantText : styles.userText]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4, paddingHorizontal: 16 },
  assistantContainer: { alignItems: 'flex-start' },
  userContainer: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    minHeight: 40,
    justifyContent: 'center',
  },
  assistantBubble: {
    backgroundColor: '#1e1e1e',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 22 },
  assistantText: { color: '#e8e8e8' },
  userText: { color: '#fff' },
});
