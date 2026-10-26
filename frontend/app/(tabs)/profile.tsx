import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  X,
  Check,
  Eye,
  MapPin,
  Lock,
  Mail,
  HelpCircle,
  Volume2,
  Moon,
  Sun,
  Camera,
  Sparkles,
  Star,
  Heart,
  ShieldCheck,
  CreditCard,
  Flame,
  Edit3,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/AuthContext';
import { apiRequest } from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [preciseLocation, setPreciseLocation] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Reviews received from other students & roommates
  const [reviewsData, setReviewsData] = useState<any>({ summary: null, reviews: [] });
  const [loadingReviews, setLoadingReviews] = useState(false);

  const reviewerPhotoMap: Record<string, string> = {
    'Tanzimul Haque': 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
    'Mamadou Diallo': 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
    'IUT Provost Office': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=1000&auto=format&fit=crop&q=85',
    'Nusrat Jahan': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    'Ibrahim Ousmane': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
    'Fatoumata Bamba': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1000&auto=format&fit=crop&q=85',
    'Farhan Shadman': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop&q=85',
    'Aminata Traoré': 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
    'Kofi Mensah': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=85',
    'Limas Soubello': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
  };

  const formatReviewDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            color={s <= rating ? '#F59E0B' : '#CBD5E1'}
            fill={s <= rating ? '#F59E0B' : 'transparent'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const loadReviews = async (userId?: string) => {
    try {
      setLoadingReviews(true);
      const endpoint = userId ? `/api/reviews/user/${userId}` : '/api/reviews/me';
      const { response, data } = await apiRequest(endpoint);
      if (response.ok && data) {
        setReviewsData(data);
      }
    } catch (err) {
      console.warn('Could not load profile reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const [editForm, setEditForm] = useState({
    sleepSchedule: 'EARLY',
    noiseTolerance: 'MEDIUM',
    smoking: false,
    smokingTolerant: false,
    cleanliness: 3,
    studyStyle: 'QUIET',
    tempPreference: 'MEDIUM',
    socialLevel: 'INTROVERT',
    bio: '',
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
          bio: data.bio || '',
        });
        loadReviews(data.userId || data.id);
      } else {
        loadReviews();
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      loadReviews();
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
        body: editForm,
      });
      if (response.ok) {
        if (Platform.OS === 'web') {
          window.alert('Profile updated successfully!');
        } else {
          Alert.alert('Saved! ✅', 'Your roommate profile has been updated.');
        }
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

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) await doLogout();
    } else {
      Alert.alert('Log Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const displayName = user?.name || 'Alex Johnson';
  const displayEmail = user?.email || 'alex.j@university.edu';
  const firstName = displayName.split(' ')[0];

  const compatibilityScore = 94;
  const totalLikes = 47;
  const totalMatches = 12;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* TINDER-STYLE HEADER */}
      <View style={styles.topBar}>
        <View style={styles.topBarCenter}>
          <Image
            source={require('../../assets/iut_logo.png')}
            style={styles.iutHeaderLogo}
          />
          <Text style={styles.topBarTitle}>IUT Student Profile</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.7}
        >
          <Settings size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* PROFILE CARD — Tinder-style big photo card */}
        <View style={styles.profileCard}>
          <View style={styles.profilePhotoContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=85',
              }}
              style={styles.profilePhoto}
              resizeMode="cover"
            />
            {/* Gradient Overlay */}
            <View style={styles.photoGradient}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{displayName}</Text>
                <ShieldCheck size={22} color="#10B981" style={{ marginLeft: 8 }} />
              </View>
              {user?.studentId ? (
                <View style={styles.studentIdBadgeWrap}>
                  <Text style={styles.studentIdBadgeText}>IUT ID: {user.studentId}</Text>
                </View>
              ) : null}
              <Text style={styles.profileEmail}>{displayEmail}</Text>
            </View>

            {/* Edit Photo Button */}
            <TouchableOpacity style={styles.editPhotoBtn} activeOpacity={0.8}>
              <Camera size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Sync Badge */}
            <View style={styles.syncBadge}>
              <Sparkles size={13} color="#fff" />
              <Text style={styles.syncBadgeText}>{compatibilityScore}% Sync</Text>
            </View>
          </View>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalLikes}</Text>
              <Text style={styles.statLabel}>Roomie Likes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalMatches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF4458' }]}>{compatibilityScore}%</Text>
              <Text style={styles.statLabel}>Avg. Sync</Text>
            </View>
          </View>

          {/* EDIT PROFILE BUTTON */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.85}
          >
            <Edit3 size={17} color="#FF4458" style={{ marginRight: 8 }} />
            <Text style={styles.editProfileBtnText}>Edit Profile & Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* LIFESTYLE SUMMARY PILLS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>MY LIVING STYLE</Text>
          <View style={styles.lifestylePillsRow}>
            {[
              { icon: editForm.sleepSchedule === 'EARLY' ? '☀️' : '🌙', label: editForm.sleepSchedule === 'EARLY' ? 'Early Riser' : 'Night Owl' },
              { icon: '🧹', label: editForm.cleanliness >= 4 ? 'Very Tidy' : 'Average Tidy' },
              { icon: editForm.noiseTolerance === 'LOW' ? '🤫' : '🎵', label: editForm.noiseTolerance === 'LOW' ? 'Quiet Zone' : 'Moderate Noise' },
              { icon: editForm.smoking ? '🚬' : '🚭', label: editForm.smoking ? 'Smoker' : 'Non-Smoker' },
              { icon: editForm.socialLevel === 'INTROVERT' ? '📚' : '🎉', label: editForm.socialLevel === 'INTROVERT' ? 'Introverted' : 'Extroverted' },
            ].map((pill, idx) => (
              <View key={idx} style={styles.lifestylePill}>
                <Text style={styles.pillEmoji}>{pill.icon}</Text>
                <Text style={styles.pillLabel}>{pill.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BIO SECTION */}
        {(editForm.bio || !loading) && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>ABOUT ME</Text>
            <TouchableOpacity style={styles.bioCard} onPress={() => setEditModalVisible(true)} activeOpacity={0.85}>
              <Text style={styles.bioText}>
                {editForm.bio || `Hi! I'm ${firstName}. Looking for a clean, respectful roommate for the upcoming semester. I respect quiet hours and love a tidy shared space! 🏠`}
              </Text>
              <View style={styles.bioEditHint}>
                <Edit3 size={13} color="#94A3B8" />
                <Text style={styles.bioEditHintText}>Tap to edit</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* REVIEWS & VIBE CHECKS FROM ROOMMATES */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>REVIEWS & VIBE CHECKS</Text>
            {reviewsData.reviews?.length > 0 && (
              <View style={styles.reviewBadgeHeader}>
                <Star size={12} color="#D97706" fill="#D97706" />
                <Text style={styles.reviewBadgeHeaderText}>
                  {(reviewsData.summary?.averageRating || reviewsData.summary?.average || 5).toFixed(1)} ({reviewsData.reviews.length})
                </Text>
              </View>
            )}
          </View>

          {loadingReviews ? (
            <View style={styles.reviewsLoadingBox}>
              <ActivityIndicator size="small" color="#FF4458" />
              <Text style={styles.reviewsLoadingText}>Loading roommate reviews...</Text>
            </View>
          ) : !reviewsData.reviews || reviewsData.reviews.length === 0 ? (
            <View style={styles.noReviewsCard}>
              <View style={styles.noReviewsIconCircle}>
                <Sparkles size={22} color="#F59E0B" />
              </View>
              <Text style={styles.noReviewsTitle}>No Reviews Yet</Text>
              <Text style={styles.noReviewsSubtitle}>
                When roommates and hall peers write vibe checks about living with you, they will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsContainer}>
              {/* Summary Header Card */}
              <View style={styles.reviewSummaryCard}>
                <View style={styles.reviewSummaryScoreCol}>
                  <Text style={styles.reviewSummaryBigScore}>
                    {(reviewsData.summary?.averageRating || reviewsData.summary?.average || 5).toFixed(1)}
                  </Text>
                  {renderStars(Math.round(reviewsData.summary?.averageRating || reviewsData.summary?.average || 5))}
                  <Text style={styles.reviewSummaryCountText}>
                    {reviewsData.reviews.length} {reviewsData.reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
                <View style={styles.reviewSummaryDivider} />
                <View style={styles.reviewSummaryTrustCol}>
                  <View style={styles.trustBadgeRow}>
                    <ShieldCheck size={16} color="#10B981" />
                    <Text style={styles.trustBadgeText}>IUT Campus Verified</Text>
                  </View>
                  <Text style={styles.trustDescText}>
                    Authentic feedback from verified students in South Hall, North Hall & FHR.
                  </Text>
                </View>
              </View>

              {/* Review Item Cards */}
              {reviewsData.reviews.map((rev: any, index: number) => {
                const reviewerName = rev.reviewer?.name || 'Fellow Student';
                const avatarUrl = reviewerPhotoMap[reviewerName];
                const initials = reviewerName
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <View key={rev.id || index} style={styles.reviewCard}>
                    <View style={styles.reviewCardTop}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.reviewerAvatar} />
                      ) : (
                        <View style={styles.reviewerAvatarFallback}>
                          <Text style={styles.reviewerInitials}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerNameRow}>
                          <Text style={styles.reviewerName}>{reviewerName}</Text>
                          {rev.isRoommate && (
                            <View style={styles.roommateTag}>
                              <Text style={styles.roommateTagText}>Roommate</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.reviewDateText}>
                          {formatReviewDate(rev.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.reviewRatingPill}>
                        <Star size={12} color="#B45309" fill="#B45309" />
                        <Text style={styles.reviewRatingPillText}>{rev.rating}.0</Text>
                      </View>
                    </View>

                    {rev.comment ? (
                      <View style={styles.reviewCommentBox}>
                        <Text style={styles.reviewCommentText}>"{rev.comment}"</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* SETTINGS LIST */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>DISCOVERY SETTINGS</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsItem}>
              <View style={[styles.settingsIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Eye size={18} color="#3B82F6" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Show My Profile</Text>
                <Text style={styles.settingsItemSub}>Visible to potential roommates</Text>
              </View>
              <Switch
                value={profileVisibility}
                onValueChange={setProfileVisibility}
                trackColor={{ false: '#D1D5DB', true: '#FF4458' }}
                thumbColor={'#fff'}
              />
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.settingsItem}>
              <View style={[styles.settingsIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <MapPin size={18} color="#10B981" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Precise Location</Text>
                <Text style={styles.settingsItemSub}>Use GPS for nearby housing</Text>
              </View>
              <Switch
                value={preciseLocation}
                onValueChange={setPreciseLocation}
                trackColor={{ false: '#D1D5DB', true: '#FF4458' }}
                thumbColor={'#fff'}
              />
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.settingsItem}>
              <View style={[styles.settingsIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Bell size={18} color="#F59E0B" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Push Notifications</Text>
                <Text style={styles.settingsItemSub}>New matches and messages</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#D1D5DB', true: '#FF4458' }}
                thumbColor={'#fff'}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>PRIVACY & SECURITY</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => Alert.alert('Blocked Users', 'You have no blocked users.')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Lock size={18} color="#EF4444" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Blocked Users</Text>
                <Text style={styles.settingsItemSub}>0 users blocked</Text>
              </View>
              <ChevronRight size={18} color="#CBD5E1" />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7}>
              <View style={[styles.settingsIconCircle, { backgroundColor: '#F0F9FF' }]}>
                <Shield size={18} color="#0EA5E9" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Safety Center</Text>
                <Text style={styles.settingsItemSub}>Community guidelines & tools</Text>
              </View>
              <ChevronRight size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => Alert.alert('Help', 'Opening Support & FAQ...')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconCircle, { backgroundColor: '#FDF4FF' }]}>
                <HelpCircle size={18} color="#A855F7" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Help & FAQ</Text>
              </View>
              <ChevronRight size={18} color="#CBD5E1" />
            </TouchableOpacity>
            <View style={styles.settingsDivider} />
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => Alert.alert('Feedback', 'Share your feedback with us!')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingsIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Mail size={18} color="#F59E0B" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsItemLabel}>Send Feedback</Text>
              </View>
              <ChevronRight size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ADMIN SHORTCUT (IF ADMIN ROLE) */}
        {user?.role === 'ADMIN' && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.adminPortalBtn}
              onPress={() => router.push('/admin' as any)}
              activeOpacity={0.85}
            >
              <Shield size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.adminPortalBtnText}>Open IUT Hall Command Portal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOGOUT & DELETE */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={() =>
              Alert.alert(
                'Delete Account',
                'This will permanently delete your account and all your data.',
                [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }]
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>RoomSync v2.4.0</Text>
        </View>
      </ScrollView>

      {/* ====================================================================== */}
      {/* EDIT PROFILE & PREFERENCES MODAL */}
      {/* ====================================================================== */}
      <Modal visible={editModalVisible} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={styles.modalTopBar}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
              <X size={22} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTopTitle}>Edit Preferences</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={styles.modalSaveBtn}>
              {saving ? (
                <ActivityIndicator size="small" color="#FF4458" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Bio */}
            <Text style={styles.modalInputLabel}>About Me (Bio)</Text>
            <TextInput
              style={styles.modalBioInput}
              multiline
              numberOfLines={4}
              value={editForm.bio}
              onChangeText={text => setEditForm(prev => ({ ...prev, bio: text }))}
              placeholder="Tell other students about yourself and your living style..."
              placeholderTextColor="#94A3B8"
            />

            {/* Sleep Schedule */}
            <Text style={styles.modalInputLabel}>Sleep Schedule</Text>
            <View style={styles.modalOptionsRow}>
              {[
                { val: 'EARLY', label: '🌅 Early Bird' },
                { val: 'LATE', label: '🌃 Night Owl' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.modalOptionBtn, editForm.sleepSchedule === opt.val && styles.modalOptionBtnActive]}
                  onPress={() => handleOptionPress('sleepSchedule', opt.val)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.sleepSchedule === opt.val && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Noise Tolerance */}
            <Text style={styles.modalInputLabel}>Noise Tolerance</Text>
            <View style={styles.modalOptionsRow}>
              {[
                { val: 'LOW', label: '🤫 Quiet' },
                { val: 'MEDIUM', label: '🎵 Moderate' },
                { val: 'HIGH', label: '🎉 Lively' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val}
                  style={[
                    styles.modalOptionBtn,
                    editForm.noiseTolerance === opt.val && styles.modalOptionBtnActive,
                  ]}
                  onPress={() => handleOptionPress('noiseTolerance', opt.val)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.noiseTolerance === opt.val && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cleanliness */}
            <Text style={styles.modalInputLabel}>Cleanliness (1–5 ⭐)</Text>
            <View style={styles.modalRatingRow}>
              {[1, 2, 3, 4, 5].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.modalRatingBtn,
                    editForm.cleanliness === level && styles.modalOptionBtnActive,
                  ]}
                  onPress={() => handleOptionPress('cleanliness', level)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.cleanliness === level && styles.modalOptionTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Study Style */}
            <Text style={styles.modalInputLabel}>Study Style</Text>
            <View style={styles.modalOptionsRow}>
              {[
                { val: 'QUIET', label: '📚 Silent' },
                { val: 'MUSIC', label: '🎧 Music' },
                { val: 'GROUP', label: '👥 Group' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.modalOptionBtn, editForm.studyStyle === opt.val && styles.modalOptionBtnActive]}
                  onPress={() => handleOptionPress('studyStyle', opt.val)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.studyStyle === opt.val && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Social Level */}
            <Text style={styles.modalInputLabel}>Social Energy</Text>
            <View style={styles.modalOptionsRow}>
              {[
                { val: 'INTROVERT', label: '🏠 Introvert' },
                { val: 'EXTROVERT', label: '🎊 Extrovert' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.modalOptionBtn, editForm.socialLevel === opt.val && styles.modalOptionBtnActive]}
                  onPress={() => handleOptionPress('socialLevel', opt.val)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.socialLevel === opt.val && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Smoking */}
            <Text style={styles.modalInputLabel}>Do you smoke?</Text>
            <View style={styles.modalOptionsRow}>
              {[
                { val: true, label: '🚬 Yes' },
                { val: false, label: '🚭 No' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val.toString()}
                  style={[styles.modalOptionBtn, editForm.smoking === opt.val && styles.modalOptionBtnActive]}
                  onPress={() => handleOptionPress('smoking', opt.val)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.smoking === opt.val && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Smoking Tolerant */}
            <Text style={styles.modalInputLabel}>OK with smoker roommates?</Text>
            <View style={styles.modalOptionsRow}>
              {[
                { val: true, label: '✅ Yes' },
                { val: false, label: '❌ No' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val.toString()}
                  style={[
                    styles.modalOptionBtn,
                    editForm.smokingTolerant === opt.val && styles.modalOptionBtnActive,
                  ]}
                  onPress={() => handleOptionPress('smokingTolerant', opt.val)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      editForm.smokingTolerant === opt.val && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.modalSaveLargeBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSaveLargeBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* TOP BAR */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iutHeaderLogo: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    marginRight: 6,
  },
  studentIdBadgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 106, 78, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  studentIdBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  adminPortalBtn: {
    backgroundColor: '#006A4E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#006A4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  adminPortalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginLeft: 6,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* PROFILE CARD */
  profileCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profilePhotoContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 60,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 3,
    fontWeight: '500',
  },
  editPhotoBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  syncBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  syncBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF4458',
    backgroundColor: '#FFF1F2',
  },
  editProfileBtnText: {
    color: '#FF4458',
    fontSize: 14,
    fontWeight: '700',
  },

  /* SECTION */
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  /* LIFESTYLE PILLS */
  lifestylePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lifestylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pillEmoji: {
    fontSize: 14,
    marginRight: 5,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  /* BIO */
  bioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bioText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  bioEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    opacity: 0.6,
  },
  bioEditHintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    fontWeight: '600',
  },

  /* SETTINGS CARD */
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  settingsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTextContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  settingsItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingsItemSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
  },

  /* LOGOUT & DELETE */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 20,
    paddingVertical: 13,
    marginBottom: 12,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteAccountBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteAccountText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  versionText: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
  },

  /* EDIT MODAL */
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTopTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FF4458',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  modalInputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 18,
    marginBottom: 10,
  },
  modalBioInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  modalOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalOptionBtn: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalOptionBtnActive: {
    borderColor: '#FF4458',
    backgroundColor: '#FFF1F2',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalOptionTextActive: {
    color: '#FF4458',
    fontWeight: '700',
  },
  modalRatingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalRatingBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalSaveLargeBtn: {
    backgroundColor: '#FF4458',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalSaveLargeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  reviewBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  reviewBadgeHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewsLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewsLoadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  noReviewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noReviewsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noReviewsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  noReviewsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewsContainer: {
    gap: 12,
  },
  reviewSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewSummaryScoreCol: {
    alignItems: 'center',
    paddingRight: 16,
    minWidth: 100,
  },
  reviewSummaryBigScore: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 38,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  reviewSummaryCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  reviewSummaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#F1F5F9',
    marginRight: 16,
  },
  reviewSummaryTrustCol: {
    flex: 1,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trustBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  trustDescText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  reviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  reviewerAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  reviewerInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  roommateTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roommateTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  reviewDateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  reviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewRatingPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewCommentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  reviewCommentText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
