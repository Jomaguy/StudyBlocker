import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useBlockStore } from '@/store/blockStore';
import { AppBlockerModule } from '@/services/native/AppBlockerModule';
import AppListItem from '@/components/apps/AppListItem';
import type { InstalledApp } from '@/types/blocking';

// Popular social/entertainment apps to show on non-Android or when native module not available
const DEMO_APPS: InstalledApp[] = [
  { packageName: 'com.instagram.android', appName: 'Instagram', isSystemApp: false },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', isSystemApp: false },
  { packageName: 'com.twitter.android', appName: 'X (Twitter)', isSystemApp: false },
  { packageName: 'com.reddit.frontpage', appName: 'Reddit', isSystemApp: false },
  { packageName: 'com.facebook.katana', appName: 'Facebook', isSystemApp: false },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', isSystemApp: false },
  { packageName: 'com.google.android.youtube', appName: 'YouTube', isSystemApp: false },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', isSystemApp: false },
];

export default function AppSelectionScreen() {
  const { blockedApps, addBlockedApp, removeBlockedApp } = useBlockStore();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        const installed = await AppBlockerModule.getInstalledApps();
        const userApps = installed.filter((a) => !a.isSystemApp).sort((a, b) =>
          a.appName.localeCompare(b.appName)
        );
        setApps(userApps.length > 0 ? userApps : DEMO_APPS);
      } else {
        setApps(DEMO_APPS);
      }
    } catch {
      setApps(DEMO_APPS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() =>
    apps.filter((a) =>
      a.appName.toLowerCase().includes(search.toLowerCase()) ||
      a.packageName.toLowerCase().includes(search.toLowerCase())
    ), [apps, search]);

  const blockedSet = useMemo(
    () => new Set(blockedApps.map((a) => a.packageName)),
    [blockedApps]
  );

  const handleToggle = (app: InstalledApp, block: boolean) => {
    if (block) {
      addBlockedApp({ packageName: app.packageName, appName: app.appName, blockedSince: Date.now() });
      AppBlockerModule.updateBlockedApps(
        [...blockedApps.map((a) => a.packageName), app.packageName]
      );
    } else {
      removeBlockedApp(app.packageName);
      AppBlockerModule.updateBlockedApps(
        blockedApps.filter((a) => a.packageName !== app.packageName).map((a) => a.packageName)
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Block Apps</Text>
        <Text style={styles.sub}>
          {blockedApps.length} blocked · Toggle to require quiz before opening
        </Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#666" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search apps..."
            placeholderTextColor="#555"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6C63FF" />
          <Text style={styles.loadingText}>Loading installed apps...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.packageName}
          renderItem={({ item }) => (
            <AppListItem
              app={item}
              isBlocked={blockedSet.has(item.packageName)}
              onToggle={handleToggle}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No apps found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, paddingBottom: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub: { color: '#666', fontSize: 13, marginBottom: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#666', fontSize: 14 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
