import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, AppState, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useStudyStore } from '@/store/studyStore';
import { useBlockStore } from '@/store/blockStore';
import { useSettingsStore } from '@/store/settingsStore';
import { AppBlockerModule } from '@/services/native/AppBlockerModule';

export default function DashboardScreen() {
  const { profile } = useStudyStore();
  const { blockedApps, isMonitoring, setMonitoring, pruneExpiredGrants } = useBlockStore();
  const { questionsNeeded, unlockDurationMin } = useSettingsStore();
  const [hasUsage, setHasUsage] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') return;
    const u = await AppBlockerModule.hasUsageStatsPermission();
    const o = await AppBlockerModule.hasOverlayPermission();
    setHasUsage(u);
    setHasOverlay(o);
    return { u, o };
  };

  useEffect(() => {
    checkPermissions();
    pruneExpiredGrants();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermissions();
    });
    return () => sub.remove();
  }, []);

  const toggleMonitor = async () => {
    const perms = await checkPermissions();
    if (!perms) return;

    if (isMonitoring) {
      AppBlockerModule.stopMonitorService();
      setMonitoring(false);
    } else {
      if (!perms.u || !perms.o) return;
      AppBlockerModule.startMonitorService(blockedApps.map((a) => a.packageName));
      setMonitoring(true);
    }
  };

  const allPermsGranted = hasUsage && hasOverlay;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Dashboard</Text>

        {/* Study Profile Card */}
        {profile && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="book" size={18} color="#6C63FF" />
              <Text style={styles.cardTitle}>Study Material</Text>
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileTopics}>
              {profile.topics.length} topics · {profile.weakAreas.length} weak areas
            </Text>
            <View style={styles.topicRow}>
              {profile.topics.slice(0, 3).map((t) => (
                <View key={t.id} style={styles.topicChip}>
                  <Text style={styles.topicChipText}>{t.title}</Text>
                </View>
              ))}
              {profile.topics.length > 3 && (
                <Text style={styles.moreTopics}>+{profile.topics.length - 3} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Blocking Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield" size={18} color={isMonitoring ? '#4CAF50' : '#888'} />
            <Text style={styles.cardTitle}>Blocking Status</Text>
          </View>

          <View style={[styles.statusBadge, isMonitoring ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, { backgroundColor: isMonitoring ? '#4CAF50' : '#888' }]} />
            <Text style={[styles.statusText, { color: isMonitoring ? '#4CAF50' : '#888' }]}>
              {isMonitoring ? 'Active — monitoring ' + blockedApps.length + ' apps' : 'Inactive'}
            </Text>
          </View>

          {Platform.OS === 'android' && !allPermsGranted && (
            <View style={styles.permWarning}>
              {!hasUsage && (
                <TouchableOpacity style={styles.permRow} onPress={AppBlockerModule.requestUsageStatsPermission}>
                  <Ionicons name="alert-circle" size={16} color="#FF9800" />
                  <Text style={styles.permText}>Grant Usage Access →</Text>
                </TouchableOpacity>
              )}
              {!hasOverlay && (
                <TouchableOpacity style={styles.permRow} onPress={AppBlockerModule.requestOverlayPermission}>
                  <Ionicons name="alert-circle" size={16} color="#FF9800" />
                  <Text style={styles.permText}>Grant Display Over Apps →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.toggleButton, (!allPermsGranted && !isMonitoring && Platform.OS === 'android') && styles.toggleDisabled]}
            onPress={toggleMonitor}
            disabled={!allPermsGranted && !isMonitoring && Platform.OS === 'android'}
          >
            <Text style={styles.toggleText}>{isMonitoring ? 'Stop Blocking' : 'Start Blocking'}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{blockedApps.length}</Text>
            <Text style={styles.statLabel}>Apps Blocked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{questionsNeeded}</Text>
            <Text style={styles.statLabel}>Questions Needed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{unlockDurationMin}m</Text>
            <Text style={styles.statLabel}>Unlock Window</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 20 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  profileTopics: { color: '#666', fontSize: 13, marginBottom: 10 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: { backgroundColor: '#1e1e1e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  topicChipText: { color: '#aaa', fontSize: 12 },
  moreTopics: { color: '#555', fontSize: 12, alignSelf: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusActive: { backgroundColor: '#4CAF5011' },
  statusInactive: { backgroundColor: '#1a1a1a' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14 },
  permWarning: { marginBottom: 12, gap: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  permText: { color: '#FF9800', fontSize: 13 },
  toggleButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleDisabled: { backgroundColor: '#333' },
  toggleText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  statNumber: { color: '#6C63FF', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 2 },
});
