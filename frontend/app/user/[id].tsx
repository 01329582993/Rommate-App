import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, Star, ShieldCheck, Pencil } from 'lucide-react-native';
import { Theme, gradients, shadow, type, matchTone } from '../../src/theme';
import { useLayout } from '../../src/responsive';
import { apiRequest } from '../../src/api';
import { StarRating } from '../../src/components/StarRating';
import { ReviewModal } from '../../src/components/ReviewModal';
import { Avatar, Button, Card, Chip, Content, IconButton, Screen } from '../../src/components/ui';
import { getReviewsForUser, deleteReview, ReviewsResponse, formatDate } from '../../src/reviewApi';

const SLEEP: Record<string, string> = { EARLY: '🌅 Early bird', LATE: '🌃 Night owl' };
const NOISE: Record<string, string> = { LOW: '🤫 Prefers quiet', MEDIUM: '🔉 Moderate noise', HIGH: '🔊 Noise is fine' };
const STUDY: Record<string, string> = { QUIET: '📖 Quiet study', MUSIC: '🎧 Studies with music', GROUP: '👥 Group study' };
const SOCIAL: Record<string, string> = { INTROVERT: '🏠 Introvert', EXTROVERT: '🎉 Extrovert' };
const TEMP: Record<string, string> = { COLD: '❄️ Likes it cool', MEDIUM: '🌤️ Moderate temp', WARM: '☀️ Likes it warm' };

function CompatRing({ score, size = 92 }: { score: number; size?: number }) {
  const tone = matchTone(score);
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF0F6" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={score === 0 ? '#EF4444' : tone.fg} strokeWidth={stroke} fill="none"
          strokeDasharray={`${(c * Math.max(score, 2)) / 100} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.ringText, { color: score === 0 ? '#B91C1C' : tone.fg }]}>{score}%</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { gutter } = useLayout();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [liking, setLiking] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [p, r] = await Promise.all([apiRequest(`/api/users/${id}`), getReviewsForUser(String(id))]);
      if (!p.response.ok) {
        setError(p.data?.message || 'Could not load this profile.');
        return;
      }
      setProfile(p.data);
      if (r.response.ok) setReviews(r.data);
    } catch (e: any) {
      setError(e?.message || 'Could not load this profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLike = async () => {
    if (!profile || profile.liked || liking) return;
    setLiking(true);
    try {
      const { response, data } = await apiRequest('/api/matches/like', { method: 'POST', body: { toId: profile.id } });
      if (response.ok) {
        setProfile({ ...profile, liked: true, isMutual: !!data.isMutual });
        if (data.isMutual) Alert.alert("It's a match! 🎉", `You and ${profile.name} liked each other. You can chat now.`);
      } else {
        Alert.alert('Notice', data?.message || 'Could not like this person.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not like this person.');
    } finally {
      setLiking(false);
    }
  };

  const openChat = () => router.push({ pathname: '/chat/[id]', params: { id: profile.id, name: profile.name, isGroup: 'false' } });

  const confirmDeleteReview = (reviewId: string) => {
    Alert.alert('Delete review?', 'This removes your review.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { response, data } = await deleteReview(reviewId);
            if (response.ok) load();
            else Alert.alert('Could not delete', data?.message || 'Please try again.');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not delete review');
          }
        },
      },
    ]);
  };

  const Banner = ({ children }: { children?: React.ReactNode }) => (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
      <SafeAreaView edges={['top']}>
        <View style={styles.bannerTop}>
          <IconButton onPress={() => router.back()} label="Back"><ArrowLeft size={20} color={Theme.colors.text} /></IconButton>
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return (
      <Screen edges={[]}>
        <Banner />
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen edges={[]}>
        <Banner />
        <View style={styles.center}>
          <Text style={[type.secondary, { textAlign: 'center', marginBottom: 16 }]}>{error || 'Profile not found.'}</Text>
          <Button title="Try again" onPress={() => { setLoading(true); load(); }} style={{ minWidth: 160 }} />
        </View>
      </Screen>
    );
  }

  const summary = reviews?.summary;
  const total = summary?.count || 0;
  const p = profile.profile;
  const compat: number | null = profile.compatibility;
  const tags = p
    ? [SLEEP[p.sleepSchedule], NOISE[p.noiseTolerance], p.smoking ? '🚬 Smoker' : '🚭 Non-smoker', `🧹 Cleanliness ${p.cleanliness}/5`, STUDY[p.studyStyle], SOCIAL[p.socialLevel], TEMP[p.tempPreference]].filter(Boolean)
    : [];

  return (
    <Screen edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor="#fff" progressViewOffset={70} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Banner />

        <Content style={{ paddingHorizontal: gutter, marginTop: -70 }}>
          {/* Identity */}
          <Card style={styles.idCard}>
            <View style={{ marginTop: -64 }}><Avatar name={profile.name} size={96} ring /></View>
            <Text style={styles.name}>{profile.name}{profile.isMe ? ' (you)' : ''}</Text>

            <View style={styles.ratingRow}>
              {total > 0 ? (
                <>
                  <StarRating value={summary!.average} size={20} />
                  <Text style={styles.ratingNum}>{summary!.average.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>· {total} review{total === 1 ? '' : 's'}</Text>
                </>
              ) : (
                <Text style={styles.noReviews}>No reviews yet</Text>
              )}
            </View>

            {profile.sharesGroup && !profile.isMe && (
              <View style={{ marginTop: 12 }}>
                <Chip label="In your group" bg={Theme.colors.successSoft} fg="#047857" icon={<ShieldCheck size={13} color="#047857" />} />
              </View>
            )}
            {!!profile.bio && <Text style={styles.bio}>"{profile.bio}"</Text>}

            {!profile.isMe && (
              <View style={styles.actions}>
                <Pressable
                  onPress={handleLike}
                  disabled={profile.liked || liking}
                  style={({ pressed }) => [styles.likeBtn, profile.liked && { backgroundColor: Theme.colors.error, borderColor: Theme.colors.error }, pressed && { opacity: 0.85 }]}
                >
                  <Heart size={19} color={profile.liked ? '#fff' : Theme.colors.error} fill={profile.liked ? '#fff' : 'transparent'} />
                  <Text style={[styles.likeText, profile.liked && { color: '#fff' }]}>{profile.isMutual ? 'Matched' : profile.liked ? 'Liked' : 'Like'}</Text>
                </Pressable>
                <Button title="Message" icon={<MessageCircle size={18} color="#fff" />} onPress={openChat} style={{ flex: 1 }} />
              </View>
            )}
          </Card>

          {/* Compatibility */}
          {!profile.isMe && compat !== null && (
            <Card style={{ marginTop: 14 }}>
              <View style={styles.compatRow}>
                <CompatRing score={compat} />
                <View style={{ flex: 1, marginLeft: 18 }}>
                  <Text style={type.heading}>{compat === 0 ? 'Not compatible' : matchTone(compat).label}</Text>
                  <Text style={[type.secondary, { marginTop: 2 }]}>Compatibility with you</Text>
                </View>
              </View>
              {profile.compatibilityDetails.length > 0 && (
                <View style={styles.details}>
                  {profile.compatibilityDetails.map((d: string, i: number) => (
                    <View key={i} style={styles.detailRow}>
                      <View style={styles.bullet} />
                      <Text style={[type.secondary, { flex: 1 }]}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Lifestyle */}
          {tags.length > 0 && (
            <Card style={{ marginTop: 14 }}>
              <Text style={[type.heading, { marginBottom: 12 }]}>Lifestyle</Text>
              <View style={styles.tags}>
                {tags.map((t, i) => <Chip key={i} label={t as string} bg={Theme.colors.background} fg={Theme.colors.text} />)}
              </View>
            </Card>
          )}

          {/* Reviews */}
          <Card style={{ marginTop: 14 }}>
            <View style={styles.reviewsHeader}>
              <Text style={type.heading}>Reviews</Text>
              {!profile.isMe && (
                <Button
                  compact
                  title={profile.myReview ? 'Edit mine' : 'Write review'}
                  icon={profile.myReview ? <Pencil size={14} color="#fff" /> : <Star size={14} color="#fff" fill="#fff" />}
                  onPress={() => setReviewOpen(true)}
                />
              )}
            </View>

            {total > 0 && summary && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryBig}>
                  <Text style={styles.bigNum}>{summary.average.toFixed(1)}</Text>
                  <StarRating value={summary.average} size={14} />
                  <Text style={type.caption}>{total} review{total === 1 ? '' : 's'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = summary.distribution[String(n)] || 0;
                    return (
                      <View key={n} style={styles.distRow}>
                        <Text style={styles.distLabel}>{n}</Text>
                        <View style={styles.distTrack}><View style={[styles.distFill, { width: `${(count / total) * 100}%` }]} /></View>
                        <Text style={styles.distCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {reviews && reviews.reviews.length === 0 ? (
              <Text style={[type.secondary, { paddingVertical: 8 }]}>
                {profile.isMe ? 'Nobody has reviewed you yet. Reviews from other students will appear here.' : `Nobody has reviewed ${profile.name.split(' ')[0]} yet. Be the first!`}
              </Text>
            ) : (
              reviews?.reviews.map((r) => (
                <View key={r.id} style={styles.review}>
                  <View style={styles.reviewTop}>
                    <Avatar name={r.reviewer.name} size={38} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewer}>{r.mine ? 'You' : r.reviewer.name}</Text>
                      <Text style={type.caption}>{formatDate(r.updatedAt || r.createdAt)}</Text>
                    </View>
                    {r.isRoommate && <Chip label="Roommate" bg={Theme.colors.successSoft} fg="#047857" icon={<ShieldCheck size={12} color="#047857" />} />}
                  </View>
                  <View style={{ marginTop: 10 }}><StarRating value={r.rating} size={15} /></View>
                  {!!r.comment && <Text style={styles.comment}>{r.comment}</Text>}
                  {r.mine && (
                    <View style={styles.mineActions}>
                      <Pressable onPress={() => setReviewOpen(true)}><Text style={styles.link}>Edit</Text></Pressable>
                      <Pressable onPress={() => confirmDeleteReview(r.id)}><Text style={[styles.link, { color: Theme.colors.error }]}>Delete</Text></Pressable>
                    </View>
                  )}
                </View>
              ))
            )}
          </Card>
        </Content>
      </ScrollView>

      {!profile.isMe && (
        <ReviewModal visible={reviewOpen} onClose={() => setReviewOpen(false)} revieweeId={profile.id} revieweeName={profile.name} existing={profile.myReview} onChanged={load} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  banner: { height: 190, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  bannerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  idCard: { alignItems: 'center', paddingBottom: 22, ...shadow.md },
  name: { fontSize: 25, fontWeight: '800', color: Theme.colors.text, letterSpacing: -0.5, marginTop: 12, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  ratingNum: { fontSize: 16, fontWeight: '800', color: Theme.colors.text },
  ratingCount: { fontSize: 14, color: Theme.colors.textSecondary },
  noReviews: { fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600' },
  bio: { fontSize: 14, lineHeight: 21, fontStyle: 'italic', color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 14, paddingHorizontal: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, paddingHorizontal: 22, borderRadius: 27, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FECACA' },
  likeText: { fontSize: 16, fontWeight: '700', color: Theme.colors.error },
  compatRow: { flexDirection: 'row', alignItems: 'center' },
  ringText: { position: 'absolute', fontSize: 22, fontWeight: '800' },
  details: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.colors.border, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.primary, marginTop: 7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 8, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Theme.colors.border },
  summaryBig: { alignItems: 'center', gap: 4, minWidth: 84 },
  bigNum: { fontSize: 40, fontWeight: '800', color: Theme.colors.text, letterSpacing: -1 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  distLabel: { width: 14, fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  distTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: '#EEF0F6', marginHorizontal: 8, overflow: 'hidden' },
  distFill: { height: '100%', backgroundColor: Theme.colors.star, borderRadius: 4 },
  distCount: { width: 22, textAlign: 'right', fontSize: 12, color: Theme.colors.textSecondary },
  review: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.colors.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center' },
  reviewer: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  comment: { marginTop: 8, fontSize: 14, color: '#334155', lineHeight: 21 },
  mineActions: { flexDirection: 'row', gap: 20, marginTop: 12 },
  link: { fontSize: 13, fontWeight: '700', color: Theme.colors.primary },
});
