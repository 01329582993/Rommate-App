import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bell, Search, Filter, Heart, Users, MessageCircle, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/theme';
import { apiRequest, getStoredUser } from '../../src/api';

import { Clipboard } from 'react-native';
import { getMyGroup } from '../../src/groupApi';

export default function DiscoverScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');

  const loadMatches = async () => {
    try {
      setLoading(true);
      const user = await getStoredUser();
      if (user?.name) setUserName(user.name.split(' ')[0]);

      const { response, data } = await apiRequest('/api/matches');
      if (response.ok) {
        const normalized = (data || []).map((item: any, index: number) => ({
          id: item.userId || `${index}`,
          name: item.name || 'Roommate Match',
          score: item.compatibility || 0,
          bio: item.details?.join?.(' • ') || 'Highly compatible roommate match',
          tags: ['Compatible', 'Ready'],
          color: index % 2 === 0 ? '#E3F2FD' : '#F3E5F5',
        }));
        setMatches(normalized);
      } else {
        Alert.alert('Unable to load matches', data?.message || 'Please try again later.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Connection error', 'Could not reach the backend.');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadMatches();
  }, []);

  const handleInvitesPress = async () => {
    try {
      const { response, data } = await getMyGroup();
      if (response.ok && data?.id) {
        const inviteLink = `http://localhost:8081/join?code=${data.id}`;
        Alert.alert(
          'Group Invite Link',
          `Share this link to invite others to your group "${data.name}":\n\n${inviteLink}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Copy Link', 
              onPress: () => {
                Clipboard.setString(inviteLink);
                Alert.alert('Copied', 'Invite link copied to clipboard!');
              } 
            }
          ]
        );
      } else {
        Alert.alert('No Group Found', 'You are not in a group yet. Go to the Groups tab to create one!');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to fetch your group info.');
    }
  };



  const handleLikeUser = async (toId: string, name: string) => {
    try {
      const { response, data } = await apiRequest('/api/matches/like', {
        method: 'POST',
        body: { toId }
      });
      if (response.ok) {
        Alert.alert(data.isMutual ? 'It\'s a Match! 🎉' : 'Liked', data.message || `You liked ${name}.`);
      } else {
        Alert.alert('Notice', data?.message || 'Successfully updated likes.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const quickActions = [
    { id: 1, title: 'My Group', icon: <Users color="#fff" size={24} />, color: Theme.colors.primary, onPress: () => router.push('/(tabs)/groups') },
    { id: 2, title: 'Invites', icon: <MessageCircle color="#fff" size={24} />, color: '#34C759', onPress: handleInvitesPress },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.welcomeBack}>FIND YOUR MATCH</Text>
          <Text style={styles.appName}>Hi {userName}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell color={Theme.colors.text} size={24} />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search color="#999" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search roommates..."
              placeholderTextColor="#999"
            />
            <Filter color={Theme.colors.primary} size={20} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={[styles.iconCircle, { backgroundColor: action.color }]}>
                  {action.icon}
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Picks for You</Text>
            <TouchableOpacity onPress={loadMatches}>
              <Text style={styles.viewAll}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Loading matches...</Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>No matches found yet.</Text>
            </View>
          ) : (
            <FlatList
              data={matches}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.featuredCard}>
                  <View style={[styles.imageWrapper, { backgroundColor: item.color }]}>
                    <View style={styles.compatibilityBadge}>
                      <Star size={12} color="#fff" fill="#fff" />
                      <Text style={styles.compatibilityText}>{item.score}%</Text>
                    </View>
                    <TouchableOpacity style={styles.favBtn} onPress={() => handleLikeUser(item.id, item.name)}>
                      <Heart size={18} color={Theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.featuredContent}>
                    <Text style={styles.catLabel}>{item.tags.join(' • ')}</Text>
                    <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.prodPrice}>{item.bio}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Community Activity (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
             <Users color={Theme.colors.primary} size={24} />
             <Text style={styles.activityText}>3 new students joined your department today!</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#f0f0f0', borderWidth: 2, borderColor: Theme.colors.primary },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  welcomeBack: { fontSize: 10, color: '#999', fontWeight: '800', letterSpacing: 1.5 },
  appName: { fontSize: 22, fontWeight: '900', color: '#0a1a1f' },
  notificationBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F7F9F7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  dot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.error, borderWidth: 1.5, borderColor: '#fff' },
  searchSection: { paddingHorizontal: 20, marginVertical: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, height: 60, paddingHorizontal: 20, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 15, fontSize: 15, color: '#333' },
  section: { marginTop: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0a1a1f', paddingHorizontal: 20, marginBottom: 15 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  actionCard: { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionText: { fontSize: 15, fontWeight: '700', color: '#333' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  viewAll: { color: Theme.colors.primary, fontWeight: '700', fontSize: 15 },
  horizontalList: { paddingLeft: 20, paddingRight: 20 },
  featuredCard: { width: 220, marginRight: 15, backgroundColor: '#fff', borderRadius: 30, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden', padding: 12 },
  imageWrapper: { height: 140, borderRadius: 20, position: 'relative', overflow: 'hidden' },
  compatibilityBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  compatibilityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  favBtn: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  featuredContent: { paddingVertical: 10 },
  catLabel: { fontSize: 11, color: '#999', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  prodName: { fontSize: 18, fontWeight: '800', color: '#0a1a1f', marginBottom: 5 },
  prodPrice: { fontSize: 13, fontWeight: '600', color: Theme.colors.primary },
  activityCard: { marginHorizontal: 20, backgroundColor: '#F0F9FF', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 15 },
  activityText: { flex: 1, fontSize: 14, color: '#0369A1', fontWeight: '600' },
  loadingBox: { marginHorizontal: 20, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 20 },
  loadingText: { marginTop: 10, color: '#666', fontWeight: '600' },
});
