import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSend: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({ onSend, loading = false, placeholder = 'Type your answer...', disabled = false }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        multiline
        maxLength={1000}
        editable={!loading && !disabled}
        onSubmitEditing={handleSend}
      />
      <TouchableOpacity style={[styles.button, (!text.trim() || loading || disabled) && styles.buttonDisabled]} onPress={handleSend} disabled={!text.trim() || loading || disabled}>
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Ionicons name="send" size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0f0f0f',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
    marginRight: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#444' },
});
