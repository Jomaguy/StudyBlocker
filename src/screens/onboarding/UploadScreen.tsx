import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

import { useStudyStore } from '@/store/studyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getClient, analyzeMaterial } from '@/api/claude';
import type { OnboardingStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Upload'>;

export default function UploadScreen() {
  const nav = useNavigation<Nav>();
  const {
    setPendingPdf, pendingPdfName, isAnalyzing, analysisError,
    setAnalyzing, setAnalysisError, setProfile,
  } = useStudyStore();
  const { claudeApiKey } = useSettingsStore();

  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64' as any,
      });
      setPendingPdf(base64, asset.name);
      setSelectedFileName(asset.name);
      setAnalysisError(null);
    } catch (e) {
      Alert.alert('Error', 'Could not read file. Please try again.');
    }
  };

  const analyzeAndContinue = async () => {
    const store = useStudyStore.getState();
    if (!store.pendingPdfBase64 || !store.pendingPdfName) {
      Alert.alert('No file selected', 'Please upload a PDF or text file first.');
      return;
    }
    if (!claudeApiKey) {
      Alert.alert('API Key Required', 'Please add your Anthropic API key in Settings first.');
      nav.getParent()?.getParent()?.navigate('Settings' as any);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const client = getClient(claudeApiKey);
      const mimeType = store.pendingPdfName.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
      const result = await analyzeMaterial(client, store.pendingPdfBase64, mimeType, store.pendingPdfName);

      setProfile({
        id: Math.random().toString(36).slice(2),
        name: store.pendingPdfName.replace(/\.[^.]+$/, ''),
        topics: result.topics,
        weakAreas: [],
        studyGoals: [],
        rawMaterialSummary: result.rawMaterialSummary,
        onboardingComplete: false,
        createdAt: Date.now(),
      });
      nav.navigate('Interview');
    } catch (err: any) {
      setAnalysisError(err.message ?? 'Analysis failed. Check your API key and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Upload Study Material</Text>
        <Text style={styles.subtitle}>
          Add a PDF or text file. Claude will read it and create a personalized quiz to gate your blocked apps.
        </Text>

        {!claudeApiKey && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.warningText}>
              No API key set. Go to{' '}
              <Text style={styles.link} onPress={() => {}}>Settings</Text>
              {' '}to add your Anthropic key.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.uploadBox} onPress={pickDocument} activeOpacity={0.7}>
          <Ionicons name="cloud-upload-outline" size={48} color="#6C63FF" />
          <Text style={styles.uploadTitle}>
            {selectedFileName ?? 'Tap to pick a file'}
          </Text>
          <Text style={styles.uploadSub}>PDF or TXT, up to 20 MB</Text>
        </TouchableOpacity>

        {analysisError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#F44336" />
            <Text style={styles.errorText}>{analysisError}</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, (!selectedFileName || isAnalyzing) && styles.buttonDisabled]}
        onPress={analyzeAndContinue}
        disabled={!selectedFileName || isAnalyzing}
      >
        {isAnalyzing
          ? <ActivityIndicator color="#fff" />
          : <>
              <Text style={styles.buttonText}>Analyze Material</Text>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flexGrow: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#999', lineHeight: 22, marginBottom: 24 },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FF980011',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  warningText: { color: '#FF9800', fontSize: 13, flex: 1 },
  link: { textDecorationLine: 'underline' },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  uploadTitle: { color: '#ccc', fontSize: 15, fontWeight: '500' },
  uploadSub: { color: '#555', fontSize: 13 },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#F4433611',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  errorText: { color: '#F44336', fontSize: 13, flex: 1 },
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
  buttonDisabled: { backgroundColor: '#444' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
