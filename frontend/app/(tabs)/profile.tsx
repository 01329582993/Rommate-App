import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, ChevronRight, User, Shield, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    { icon: <User size={22} color="#666" />, title: 'Edit Profile' },
    { icon: <Bell size={22} color="#666" />, title: 'Notifications' },
    { icon: <Shield size={22} color="#666" />, title: 'Privacy & Security' },
    { icon: <Settings size={22} color="#666" />, title: 'Settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity>
          <Settings size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <User size={40} color="#999" />
          </View>
          <Text style={styles.name}>Student User</Text>
          <Text style={styles.email}>student@university.edu</Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuIcon}>{item.icon}</View>
              <Text style={styles.menuText}>{item.title}</Text>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={() => router.replace('/login')}
        >
          <LogOut size={22} color={Theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  content: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 3, borderColor: Theme.colors.primary },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  email: { fontSize: 14, color: '#666', marginTop: 5 },
  menuSection: { marginTop: 20, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20 },
  logoutText: { marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: Theme.colors.error }
});
