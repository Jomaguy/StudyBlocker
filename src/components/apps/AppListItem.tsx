import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InstalledApp, BlockedApp } from '@/types/blocking';

interface Props {
  app: InstalledApp;
  isBlocked: boolean;
  onToggle: (app: InstalledApp, block: boolean) => void;
}

export default function AppListItem({ app, isBlocked, onToggle }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onToggle(app, !isBlocked)} activeOpacity={0.7}>
      <View style={styles.iconPlaceholder}>
        <Ionicons name="apps" size={22} color="#6C63FF" />
      </View>
      <View style={styles.info}>
        <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
        <Text style={styles.packageName} numberOfLines={1}>{app.packageName}</Text>
      </View>
      <Switch
        value={isBlocked}
        onValueChange={(v) => onToggle(app, v)}
        trackColor={{ false: '#333', true: '#6C63FF44' }}
        thumbColor={isBlocked ? '#6C63FF' : '#888'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  iconPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1, marginRight: 8 },
  appName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  packageName: { color: '#555', fontSize: 12, marginTop: 2 },
});
