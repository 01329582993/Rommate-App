import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, ChevronRight, User, Shield, Bell, X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';
import { apiRequest } from '../../src/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    sleepSchedule: 'EARLY',
    noiseTolerance: 'MEDIUM',
    smoking: false,
    smokingTolerant: false,
    cleanliness: 3,
    studyStyle: 'QUIET',
    tempPreference: 'MEDIUM',
    socialLevel: 'INTROVERT',
    bio: ''
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { response, data } = await apiRequest('/api/profile/me');
      if (response.ok && data) {
        setProfile(data);
        setEditForm({
          sleepSchedule: data.sleepSchedule || 'EARLY',
          noiseTolerance: data.noiseTolerance || 'MEDIUM',
          smoking: !!data.smoking,
          smokingTolerant: !!data.smokingTolerant,
          cleanliness: data.cleanliness || 3,
          studyStyle: data.studyStyle || 'QUIET',
          tempPreference: data.tempPreference || 'MEDIUM',
          socialLevel: data.socialLevel || 'INTROVERT',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { response, data } = await apiRequest('/api/profile', {
        method: 'POST',
        body: editForm
      });
      if (response.ok) {
        Alert.alert('Success', 'Profile and preferences updated successfully');
        setEditModalVisible(false);
        await loadProfile();
      } else {
        Alert.alert('Unable to save', data?.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleOptionPress = (key: string, value: any) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const menuItems = [
    { 
      icon: <User size={22} color="#666" />, 
      title: 'Edit Profile & Preferences', 
      onPress: () => setEditModalVisible(true) 
    },
    { 
      icon: <Bell size={22} color="#666" />, 
      title: 'Notifications', 
      onPress: () => Alert.alert('Notifications', 'Notification settings are configured by system defaults.') 
    },
    { 
      icon: <Shield size={22} color="#666" />, 
      title: 'Privacy & Security', 
      onPress: () => Alert.alert('Privacy', 'Your profile preferences are secure and private.') 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <Settings size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <User size={40} color="#999" />
          </View>
          <Text style={styles.name}>{user?.name || 'Student User'}</Text>
          <Text style={styles.email}>{user?.email || 'student@university.edu'}</Text>
          {profile?.bio && <Text style={styles.bioText}>"{profile.bio}"</Text>}
        </View>

        {/* Current Preferences Display */}
        {profile && (
          <View style={styles.prefDisplayCard}>
            <Text style={styles.sectionTitle}>Your Roommate Profile</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}><Text style={styles.badgeText}>{profile.sleepSchedule === 'EARLY' ? '🌅 Early Bird' : '🌃 Night Owl'}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>🔊 Noise: {profile.noiseTolerance}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>{profile.smoking ? '🚬 Smoker' : '🚭 Non-Smoker'}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>🧹 Cleanliness: {profile.cleanliness}/5</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>📖 Study: {profile.studyStyle}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>👥 Social: {profile.socialLevel}</Text></View>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuIcon}>{item.icon}</View>
              <Text style={styles.menuText}>{item.title}</Text>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          <LogOut size={22} color={Theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile & Preferences Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Preferences</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={Theme.colors.primary} /> : <Check size={24} color={Theme.colors.primary} />}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Bio Input */}
            <Text style={styles.inputLabel}>About You (Bio)</Text>
            <TextInput
              style={styles.bioInput}
              multiline
              numberOfLines={3}
              value={editForm.bio}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
              placeholder="Tell other students about yourself..."
            />

            {/* Sleep Schedule */}
            <Text style={styles.inputLabel}>Sleep Schedule</Text>
            <View style={styles.optionsRow}>
              {['EARLY', 'LATE'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, editForm.sleepSchedule === opt && styles.optionBtnActive]}
                  onPress={() => handleOptionPress('sleepSchedule', opt)}
                >
                  <Text style={[styles.optionBtnText, editForm.sleepSchedule === opt && styles.optionBtnTextActive]}>
                    {opt === 'EARLY' ? '🌅 Early Bird' : '🌃 Night Owl'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Noise Tolerance */}
            <Text style={styles.inputLabel}>Noise Tolerance</Text>
            <View style={styles.optionsRow}>
              {['LOW', 'MEDIUM', 'HIGH'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, editForm.noiseTolerance === opt && styles.optionBtnActive]}
                  onPress={() => handleOptionPress('noiseTolerance', opt)}
                >
                  <Text style={[styles.optionBtnText, editForm.noiseTolerance === opt && styles.optionBtnTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cleanliness */}
            <Text style={styles.inputLabel}>Cleanliness Level (1-5)</Text>
            <View style={styles.optionsRow}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.ratingBtn, editForm.cleanliness === level && styles.ratingBtnActive]}
                  onPress={() => handleOptionPress('cleanliness', level)}
                >
                  <Text style={[styles.optionBtnText, editForm.cleanliness === level && styles.optionBtnTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Study Style */}
            <Text style={styles.inputLabel}>Study Style</Text>
            <View style={styles.optionsRow}>
              {['QUIET', 'MUSIC', 'GROUP'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, editForm.studyStyle === opt && styles.optionBtnActive]}
                  onPress={() => handleOptionPress('studyStyle', opt)}
                >
                  <Text style={[styles.optionBtnText, editForm.studyStyle === opt && styles.optionBtnTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Social Level */}
            <Text style={styles.inputLabel}>Social Level</Text>
            <View style={styles.optionsRow}>
              {['INTROVERT', 'EXTROVERT'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, editForm.socialLevel === opt && styles.optionBtnActive]}
                  onPress={() => handleOptionPress('socialLevel', opt)}
                >
                  <Text style={[styles.optionBtnText, editForm.socialLevel === opt && styles.optionBtnTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Smoking Option */}
            <Text style={styles.inputLabel}>Do you smoke?</Text>
            <View style={styles.optionsRow}>
              {[true, false].map((val) => (
                <TouchableOpacity
                  key={val.toString()}
                  style={[styles.optionBtn, editForm.smoking === val && styles.optionBtnActive]}
                  onPress={() => handleOptionPress('smoking', val)}
                >
                  <Text style={[styles.optionBtnText, editForm.smoking === val && styles.optionBtnTextActive]}>
                    {val ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Smoking Tolerant */}
            <Text style={styles.inputLabel}>Are you tolerant of smoking roommates?</Text>
            <View style={styles.optionsRow}>
              {[true, false].map((val) => (
                <TouchableOpacity
                  key={val.toString()}
                  style={[styles.optionBtn, editForm.smokingTolerant === val && styles.optionBtnActive]}
                  onPress={() => handleOptionPress('smokingTolerant', val)}
                >
                  <Text style={[styles.optionBtnText, editForm.smokingTolerant === val && styles.optionBtnTextActive]}>
                    {val ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  bioText: { fontSize: 14, fontStyle: 'italic', color: '#555', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  prefDisplayCard: { margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: '#F0F4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D9E2FF' },
  badgeText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  menuSection: { marginTop: 10, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20 },
  logoutText: { marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: Theme.colors.error },
  
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalScroll: { padding: 20 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8 },
  bioInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, fontSize: 15, height: 80, backgroundColor: '#FAFAFA', textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  optionBtn: { flex: 1, minWidth: '45%', borderWidth: 1, borderColor: '#eee', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FAFAFA' },
  optionBtnActive: { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary + '10' },
  optionBtnText: { fontSize: 14, color: '#666', fontWeight: '600' },
  optionBtnTextActive: { color: Theme.colors.primary },
  ratingBtn: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  ratingBtnActive: { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary + '10' },
  saveBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
