import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="school" size={64} color="#6C63FF" />
        </View>
        <Text style={styles.title}>StudyBlocker</Text>
        <Text style={styles.subtitle}>
          Earn access to your apps by proving you've learned something. Upload study material, block distracting apps, and unlock them by answering questions correctly.
        </Text>

        <View style={styles.features}>
          {[
            { icon: 'document-text', text: 'Upload your notes or PDF' },
            { icon: 'shield-checkmark', text: 'Block distracting apps' },
            { icon: 'chatbubble-ellipses', text: 'AI quizzes you to unlock them' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.feature}>
              <Ionicons name={icon as any} size={20} color="#6C63FF" style={styles.featureIcon} />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => nav.navigate('Upload')}>
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#6C63FF22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#999', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  features: { width: '100%', gap: 16 },
  feature: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { marginRight: 12 },
  featureText: { color: '#ccc', fontSize: 15 },
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
