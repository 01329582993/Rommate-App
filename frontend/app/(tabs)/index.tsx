import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bell, Search, Filter, Heart, Users, MessageCircle, MapPin, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/theme';

export default function DiscoverScreen() {
  const router = useRouter();
  const [matches] = useState([
    { id: '1', name: 'Alex Johnson', score: 95, bio: 'Early bird, quiet study style, clean freak.', tags: ['Quiet', 'Clean'], color: '#E3F2FD' },
    { id: '2', name: 'Jordan Smith', score: 88, bio: 'Social butterfly, late sleeper, likes music.', tags: ['Social', 'Late Owl'], color: '#F3E5F5' },
    { id: '3', name: 'Casey Lee', score: 82, bio: 'Introvert, very clean, non-smoker.', tags: ['Introvert', 'Clean'], color: '#E8F5E9' },
  ]);

  const quickActions = [
    { id: 1, title: 'My Group', icon: <Users color="#fff" size={24} />, color: Theme.colors.primary },
    { id: 2, title: 'Invites', icon: <MessageCircle color="#fff" size={24} />, color: '#34C759' },
    { id: 3, title: 'Nearby', icon: <MapPin color="#fff" size={24} />, color: '#FF9500' },
    { id: 4, title: 'Favorites', icon: <Heart color="#fff" size={24} />, color: '#FF2D55' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.welcomeBack}>FIND YOUR MATCH</Text>
          <Text style={styles.appName}>Room<Text style={{color: Theme.colors.primary}}>Sync</Text></Text>
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
              <TouchableOpacity key={action.id} style={styles.actionCard}>
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
            <TouchableOpacity>
              <Text style={styles.viewAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
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
                  <TouchableOpacity style={styles.favBtn}>
                    <Heart size={18} color={Theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.featuredContent}>
                  <Text style={styles.catLabel}>{item.tags.join(' • ')}</Text>
                  <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.prodPrice}>Highly Compatible</Text>
                </View>
              </TouchableOpacity>
            )}
          />
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
});
