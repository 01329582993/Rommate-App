import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserPlus, Lock } from 'lucide-react-native';
import { Theme } from '../../src/theme';

export default function GroupsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Group</Text>
        <TouchableOpacity style={styles.createBtn}>
          <UserPlus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Users size={40} color={Theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Group Yet</Text>
          <Text style={styles.emptySubtitle}>
            Find roommates and form a group of 3-4 people to lock your room.
          </Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Create a Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  createBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  emptyState: { alignItems: 'center', paddingBottom: 100 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10 },
  emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  button: { backgroundColor: Theme.colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
