import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSettingsStore } from '@/store/settingsStore';
import { useStudyStore } from '@/store/studyStore';
import { useBlockStore } from '@/store/blockStore';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const { questionsNeeded, unlockDurationMin, claudeApiKey, setQuestionsNeeded, setUnlockDurationMin, setClaudeApiKey } = useSettingsStore();
  const { clearProfile } = useStudyStore();
  const { blockedApps, setMonitoring, removeBlockedApp } = useBlockStore();
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey);
  const [showKey, setShowKey] = useState(false);

  const saveApiKey = () => {
    setClaudeApiKey(apiKeyInput.trim());
    Alert.alert('Saved', 'API key saved.');
  };

  const resetStudyMaterial = () => {
    Alert.alert(
      'Reset Study Material',
      'This will clear your current study profile and restart onboarding. Your blocked apps list will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearProfile();
            setMonitoring(false);
          },
        },
      ]
    );
  };

  const durationOptions = [15, 30, 60, 120];
  const questionOptions = [1, 2, 3, 4, 5];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        {/* API Key */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anthropic API Key</Text>
          <Text style={styles.sectionSub}>Required for Claude to generate and evaluate quiz questions.</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="sk-ant-..."
              placeholderTextColor="#555"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey((v) => !v)} style={styles.eyeButton}>
              <Ionicons name={showKey ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={saveApiKey}>
            <Text style={styles.saveButtonText}>Save Key</Text>
          </TouchableOpacity>
        </View>

        {/* Questions Needed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions to Unlock</Text>
          <Text style={styles.sectionSub}>Correct answers in a row needed to open a blocked app.</Text>
          <View style={styles.optionsRow}>
            {questionOptions.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.optionChip, questionsNeeded === n && styles.optionChipActive]}
                onPress={() => setQuestionsNeeded(n)}
              >
                <Text style={[styles.optionText, questionsNeeded === n && styles.optionTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Unlock Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlock Duration</Text>
          <Text style={styles.sectionSub}>How long the app stays unlocked after passing the quiz.</Text>
          <View style={styles.optionsRow}>
            {durationOptions.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.optionChip, unlockDurationMin === m && styles.optionChipActive]}
                onPress={() => setUnlockDurationMin(m)}
              >
                <Text style={[styles.optionText, unlockDurationMin === m && styles.optionTextActive]}>
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={resetStudyMaterial}>
            <Ionicons name="refresh" size={16} color="#F44336" />
            <Text style={styles.dangerText}>Reset Study Material & Restart Onboarding</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 24 },
  section: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: '#666', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'monospace',
  },
  eyeButton: { padding: 12 },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  optionsRow: { flexDirection: 'row', gap: 8 },
  optionChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionChipActive: { borderColor: '#6C63FF', backgroundColor: '#6C63FF22' },
  optionText: { color: '#888', fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#6C63FF' },
  dangerSection: { borderColor: '#F4433622' },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dangerText: { color: '#F44336', fontSize: 14 },
});
