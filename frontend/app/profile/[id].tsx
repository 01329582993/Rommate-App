import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Sparkles, Book, Clock, MapPin, X, Heart, Moon, Sun, Volume2, Users, Flame, Cigarette, CigaretteOff, MessageSquare } from 'lucide-react-native';
import { apiRequest } from '../../src/api';
import { Theme } from '../../src/theme';

const { width } = Dimensions.get('window');

// Custom Broom icon representation
const BroomIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size - 4, color }}>🧹</Text>
  </View>
);

export default function ProfileDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const searchName = params.name as string;
  const score = params.score ? Number(params.score) : 94;
  
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Photos map based on name or ID to match authentic IUT African & Bangladeshi students
  const photoMap: Record<string, string> = {
    'demo-1': 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
    'demo-2': 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
    'demo-3': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    'demo-4': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
    'demo-5': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1000&auto=format&fit=crop&q=85',
    'demo-6': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop&q=85',
    'Tanzimul': 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
    'Mamadou': 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
    'Nusrat': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    'Ibrahim': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
    'Fatoumata': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1000&auto=format&fit=crop&q=85',
    'Farhan': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop&q=85',
    'Aminata': 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
    'Kofi': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=85',
    'Zainab': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
    'Bakary': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
    'Ayesha': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
    'Samiul': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1000&auto=format&fit=crop&q=85',
    'Tasnia': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=85',
    'Ousmane': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
    'Sarah': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    'David': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    'Alex': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  };

  const getPhoto = (userId: string, userName: string) => {
    if (photoMap[userId]) return photoMap[userId];
    const firstName = (userName || '').split(' ')[0].split(',')[0];
    if (firstName && photoMap[firstName]) return photoMap[firstName];
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { response, data } = await apiRequest(`/api/profile/user/${id}`);
      if (response.ok && data) {
        setProfile(data);
      } else {
        // Fallback realistic demo profile
        setProfile({
          id,
          userId: id,
          bio: "I'm a fairly quiet person who loves deep-focus work sessions during the day but enjoys a good movie night on weekends. I keep my space organized and value open communication about house chores. Looking for someone with a similar academic-focused lifestyle.",
          sleepSchedule: 'EARLY',
          noiseTolerance: 'LOW',
          smoking: false,
          smokingTolerant: true,
          cleanliness: 4,
          studyStyle: 'QUIET',
          tempPreference: 'MEDIUM',
          socialLevel: 'INTROVERT',
          user: {
            name: searchName || 'Elena Rodriguez',
            studentId: '200041110',
            email: 'elena.r@iut-dhaka.edu',
            gender: 'FEMALE'
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const targetName = profile?.user?.name || searchName || 'Roommate';

  const handleLike = async () => {
    try {
      const { response, data } = await apiRequest('/api/matches/like', {
        method: 'POST',
        body: { toId: id }
      });
      if (response.ok) {
        Alert.alert(data.isMutual ? 'It\'s a Match! 🎉' : 'Liked ✨', `You liked ${targetName}!`);
        router.back();
      } else {
        Alert.alert('Liked ✨', `You liked ${targetName}!`);
        router.back();
      }
    } catch (e) {
      Alert.alert('Liked ✨', `You liked ${targetName}!`);
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const compatibilityScore = score || profile?.compatibility || 94;
  const userPhoto = getPhoto(id, targetName);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RoomSync</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => Alert.alert('Share Profile 🔗', `Share ${targetName}'s RoomSync profile with friends.`)}
          >
            <Share2 size={22} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Photo */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: userPhoto }} style={styles.profileImage} />
          <View style={styles.imageOverlay}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.profileName}>{targetName}, 22</Text>
              {profile?.user?.studentId ? (
                <View style={styles.studentIdBadgeMini}>
                  <Text style={styles.studentIdBadgeMiniText}>ID: {profile.user.studentId}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.roleContainer}>
              <Text style={styles.profileSubtitle}>Islamic University of Technology (IUT)</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{compatibilityScore}% SYNC</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>About {targetName.split(' ')[0]}</Text>
          <Text style={styles.bioText}>{profile?.bio || "No biography provided yet."}</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile?.socialLevel === 'INTROVERT' ? '🌿 Introvert' : '🎉 Extrovert'}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile?.sleepSchedule === 'EARLY' ? '🌅 Morning Person' : '🌙 Night Owl'}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>🎓 Final Year</Text>
            </View>
          </View>
        </View>

        {/* Why You Match Card */}
        <View style={[styles.infoCard, styles.whyMatchCard]}>
          <View style={styles.whyMatchTitleRow}>
            <Sparkles size={18} color="#4F46E5" />
            <Text style={[styles.cardTitle, { color: '#4F46E5', marginBottom: 0, marginLeft: 8 }]}>Why you match</Text>
          </View>

          <View style={styles.reasonList}>
            {/* Reason 1: Smoke-free */}
            <View style={styles.reasonItem}>
              <View style={styles.reasonIconCircle}>
                <CigaretteOff size={18} color="#4F46E5" />
              </View>
              <View style={styles.reasonTextContainer}>
                <Text style={styles.reasonHeading}>Smoke-free lifestyle</Text>
                <Text style={styles.reasonSub}>Both of you prefer a clean air environment.</Text>
              </View>
            </View>

            {/* Reason 2: Study Habits */}
            <View style={styles.reasonItem}>
              <View style={styles.reasonIconCircle}>
                <Book size={18} color="#4F46E5" />
              </View>
              <View style={styles.reasonTextContainer}>
                <Text style={styles.reasonHeading}>Study Habits</Text>
                <Text style={styles.reasonSub}>Both value quiet hours during weekdays.</Text>
              </View>
            </View>

            {/* Reason 3: Cleanliness Level */}
            <View style={styles.reasonItem}>
              <View style={styles.reasonIconCircle}>
                <BroomIcon size={18} color="#4F46E5" />
              </View>
              <View style={styles.reasonTextContainer}>
                <Text style={styles.reasonHeading}>Cleanliness Level</Text>
                <Text style={styles.reasonSub}>Mutual commitment to a "tidy" common space.</Text>
              </View>
            </View>

            {/* Reason 4: Sleep Schedule */}
            <View style={styles.reasonItem}>
              <View style={styles.reasonIconCircle}>
                <Clock size={18} color="#4F46E5" />
              </View>
              <View style={styles.reasonTextContainer}>
                <Text style={styles.reasonHeading}>Sleep Schedule</Text>
                <Text style={styles.reasonSub}>Both are Early Birds [7am - 8am].</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Compatibility Progress Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>AI Compatibility Breakdown</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Lifestyle & Noise</Text>
              <Text style={styles.progressVal}>98%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '98%' }]} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Cleanliness & Chores</Text>
              <Text style={styles.progressVal}>92%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '92%' }]} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Socializing & Guests</Text>
              <Text style={styles.progressVal}>88%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '88%' }]} />
            </View>
          </View>
        </View>

        {/* Lifestyle card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Lifestyle Attributes</Text>
          <View style={styles.lifestyleGrid}>
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                {profile?.sleepSchedule === 'EARLY' ? <Sun size={18} color="#4F46E5" /> : <Moon size={18} color="#4F46E5" />}
              </View>
              <View style={styles.lifestyleTextContainer}>
                <Text style={styles.lifestyleLabel}>Sleep Schedule</Text>
                <Text style={styles.lifestyleVal}>{profile?.sleepSchedule === 'EARLY' ? 'Early Bird (Before 11PM)' : 'Night Owl (After 12AM)'}</Text>
              </View>
            </View>

            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Volume2 size={18} color="#4F46E5" />
              </View>
              <View style={styles.lifestyleTextContainer}>
                <Text style={styles.lifestyleLabel}>Noise Tolerance</Text>
                <Text style={styles.lifestyleVal}>{profile?.noiseTolerance === 'LOW' ? 'Quiet & Moderate' : 'Active & Upbeat'}</Text>
              </View>
            </View>

            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Users size={18} color="#4F46E5" />
              </View>
              <View style={styles.lifestyleTextContainer}>
                <Text style={styles.lifestyleLabel}>Guest Policy</Text>
                <Text style={styles.lifestyleVal}>Weekend Gatherings Only</Text>
              </View>
            </View>

            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleIconCircle}>
                <Text style={{ fontSize: 14 }}>🐾</Text>
              </View>
              <View style={styles.lifestyleTextContainer}>
                <Text style={styles.lifestyleLabel}>Pet Preference</Text>
                <Text style={styles.lifestyleVal}>Pet Friendly (Cats & Dogs)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.closeBtn]} 
          onPress={() => router.back()}
        >
          <X size={26} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.chatBtn]} 
          onPress={() =>
            router.push({
              pathname: '/chat/[id]',
              params: { id, name: targetName, isGroup: 'false' },
            })
          }
        >
          <MessageSquare size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.likeBtn]} 
          onPress={handleLike}
        >
          <Heart size={26} color="#fff" fill="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 4 },
  scrollContent: { padding: 16 },
  photoContainer: { width: '100%', height: 420, borderRadius: 24, overflow: 'hidden', position: 'relative', marginBottom: 16, backgroundColor: '#E5E7EB' },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  profileName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  profileSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, flex: 1 },
  scoreBadge: { backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scoreText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  bioText: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  
  // Why Match styles
  whyMatchCard: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  whyMatchTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  reasonList: { gap: 16 },
  reasonItem: { flexDirection: 'row', alignItems: 'center' },
  reasonIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  reasonTextContainer: { marginLeft: 12, flex: 1 },
  reasonHeading: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
  reasonSub: { fontSize: 12, color: '#4F46E5', marginTop: 1 },

  // Compatibility Bar style
  progressRow: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  progressVal: { fontSize: 14, color: '#4F46E5', fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4F46E5' },

  // Lifestyle Grid
  lifestyleGrid: { gap: 14 },
  lifestyleItem: { flexDirection: 'row', alignItems: 'center' },
  lifestyleIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  lifestyleTextContainer: { marginLeft: 12 },
  lifestyleLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  lifestyleVal: { fontSize: 14, color: '#1F2937', fontWeight: '600', marginTop: 1 },

  // Action Buttons
  actionContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 24, paddingHorizontal: 20 },
  actionBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  closeBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FEE2E2' },
  chatBtn: { backgroundColor: '#0084FF', shadowColor: '#0084FF', shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  likeBtn: { backgroundColor: '#4F46E5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  studentIdBadgeMini: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  studentIdBadgeMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006A4E',
  },
});
