import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useStudyStore } from '@/store/studyStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'ConfirmProfile'>;

export default function ConfirmProfileScreen() {
  const nav = useNavigation<Nav>();
  const { profile, updateProfile, clearPendingPdf } = useStudyStore();

  const confirmAndStart = () => {
    updateProfile({ onboardingComplete: true });
    clearPendingPdf();
    // Navigation will automatically switch to Main once onboardingComplete is true
  };

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
        </View>

        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>Here's what Claude will quiz you on:</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Topics covered</Text>
          {profile.topics.map((t) => (
            <View key={t.id} style={styles.chip}>
              <Text style={styles.chipText}>{t.title}</Text>
            </View>
          ))}
        </View>

        {profile.weakAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Focusing on your weak areas</Text>
            {profile.weakAreas.map((w, i) => (
              <View key={i} style={styles.weakChip}>
                <Ionicons name="flag" size={12} color="#FF9800" />
                <Text style={styles.weakChipText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.studyGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your goals</Text>
            {profile.studyGoals.map((g, i) => (
              <View key={i} style={styles.goalRow}>
                <Ionicons name="star" size={12} color="#6C63FF" />
                <Text style={styles.goalText}>{g}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={confirmAndStart}>
        <Text style={styles.buttonText}>Set Up Blocking</Text>
        <Ionicons name="shield" size={20} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#999', marginBottom: 28, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#6C63FF22',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  chipText: { color: '#6C63FF', fontSize: 14, fontWeight: '500' },
  weakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  weakChipText: { color: '#FF9800', fontSize: 14 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  goalText: { color: '#ccc', fontSize: 14 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
