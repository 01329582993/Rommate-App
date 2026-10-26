import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Lock,
  Copy,
  UserMinus,
  Star,
  LogOut,
  Sparkles,
  Key,
  Check,
  ShieldCheck,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  addMemberToGroup,
  createGroup,
  getMyGroup,
  joinGroup,
  lockGroup,
  removeMemberFromGroup,
  leaveGroup,
} from '../../src/groupApi';
import { ReviewModal } from '../../src/components/ReviewModal';
import { RatingLine } from '../../src/components/StarRating';
import { getReviewsForUser } from '../../src/reviewApi';

const EMOJI_OPTIONS = ['🏠', '🎓', '⚡', '🍕', '🌿', '🎮', '☕', '🚀', '💻', '🏖️'];

const PRESET_IDEAS = [
  { name: 'Quiet Scholars', emoji: '📚', tag: 'Study Focus' },
  { name: 'Hackathon Roomies', emoji: '⚡', tag: 'Tech & Code' },
  { name: 'Chill & Cozy', emoji: '🌿', tag: 'Relaxed Vibe' },
  { name: 'Early Birds', emoji: '🌅', tag: 'Morning Routine' },
  { name: 'Gym & Foodies', emoji: '🍕', tag: 'Active Life' },
];

export default function GroupsScreen() {
  const router = useRouter();
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [reviewExisting, setReviewExisting] = useState<any>(null);

  // Group creation state
  const [selectedEmoji, setSelectedEmoji] = useState('🏠');
  const [groupName, setGroupName] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [copiedCode, setCopiedCode] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [])
  );

  const openReview = async (member: any) => {
    let existing = null;
    if (member.reviewedByMe) {
      try {
        const { response, data } = await getReviewsForUser(member.id);
        if (response.ok) {
          const mine = (data.reviews || []).find((r: any) => r.mine);
          if (mine) existing = { id: mine.id, rating: mine.rating, comment: mine.comment };
        }
      } catch {}
    }
    setReviewExisting(existing);
    setReviewTarget(member);
  };

  const loadGroup = async () => {
    try {
      const { response, data } = await getMyGroup();
      if (response.ok && data?.id) {
        setGroup(data);
      } else {
        setGroup(null);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    const raw = groupName.trim();
    if (!raw) {
      Alert.alert('Squad Name Required', 'Please enter a name for your roommate group');
      return;
    }

    const finalName = raw.includes(selectedEmoji) ? raw : `${selectedEmoji} ${raw}`;
    setCreating(true);
    try {
      const { response, data } = await createGroup(finalName);
      if (response.ok) {
        Alert.alert('Squad Created! 🎉', `Welcome to "${finalName}"!`);
        setGroupName('');
        await loadGroup();
      } else {
        const errorMsg = data?.message || data?.error || 'Please try again';
        Alert.alert('Unable to create squad', String(errorMsg));
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not create squad');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    let cleanCode = joinCode.trim();
    if (!cleanCode) {
      Alert.alert('Invite Code Required', 'Enter the group invite code to join');
      return;
    }

    if (cleanCode.includes('code=')) {
      const parts = cleanCode.split('code=');
      if (parts[1]) {
        cleanCode = parts[1].split('&')[0];
      }
    }

    setJoining(true);
    try {
      const { response, data } = await joinGroup(cleanCode);
      if (response.ok) {
        Alert.alert('Joined Squad! 🙌', 'You are now part of this roommate group.');
        setJoinCode('');
        await loadGroup();
      } else {
        Alert.alert('Unable to join', data?.message || 'Invalid or expired invite code');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not join group');
    } finally {
      setJoining(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      Alert.alert('Email Required', 'Enter your classmate email to add');
      return;
    }

    setAddingMember(true);
    try {
      const { response, data } = await addMemberToGroup(memberEmail.trim());
      if (response.ok) {
        Alert.alert('Member Added! 💌', `${memberEmail.trim()} was added to your squad.`);
        setMemberEmail('');
        await loadGroup();
      } else {
        Alert.alert('Unable to add member', data?.message || 'Please verify the email address');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (member: any) => {
    if (!member?.email && !member?.id) return;

    Alert.alert('Remove Member?', `Remove ${member.name} from the squad?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingMemberId(member.id);
          try {
            const { response } = await removeMemberFromGroup(member.email || member.id);
            if (response.ok) {
              await loadGroup();
            } else {
              Alert.alert('Notice', 'Unable to remove member.');
            }
          } catch (error) {
            Alert.alert('Error', 'Could not remove member');
          } finally {
            setRemovingMemberId(null);
          }
        },
      },
    ]);
  };

  const handleLockGroup = async () => {
    try {
      const { response, data } = await lockGroup();
      if (response.ok) {
        Alert.alert('Squad Locked 🔒', 'Your group is now confirmed and locked.');
        await loadGroup();
      } else {
        Alert.alert('Unable to lock', data?.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not lock group');
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Squad',
      'Are you sure you want to leave this group? If you are the last member, this group will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { response } = await leaveGroup();
              if (response.ok) {
                Alert.alert('Left Group', 'You have left the squad');
                await loadGroup();
              }
            } catch (error) {
              Alert.alert('Error', 'Could not leave group');
            }
          },
        },
      ]
    );
  };

  const copyInviteCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const inviteCode = group?.inviteCode || group?.id || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>HOUSING CIRCLES</Text>
          <Text style={styles.title}>{group ? 'My Roommate Squad' : 'Roommate Squad'}</Text>
        </View>
        {group && (
          <View style={[styles.statusBadge, group.isLocked ? styles.statusLocked : styles.statusOpen]}>
            <Text style={[styles.statusText, group.isLocked ? styles.statusLockedText : styles.statusOpenText]}>
              {group.isLocked ? '🔒 Confirmed' : '🟢 Open (1-4)'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Syncing roommate squad...</Text>
          </View>
        ) : group ? (
          /* ── EXISTING GROUP VIEW ── */
          <View style={styles.groupCardWrapper}>
            {/* Squad Hero Banner */}
            <View style={styles.squadHeroCard}>
              <View style={styles.squadIconBadge}>
                <Users size={32} color="#6366F1" />
              </View>
              <Text style={styles.squadHeroTitle}>{group.name || 'Roommate Circle'}</Text>
              <Text style={styles.squadHeroSubtitle}>
                {group.isLocked
                  ? 'Your squad roster is locked and ready for lease signing'
                  : 'Open for roommates — invite friends or find matches'}
              </Text>

              {/* Invite Code Pill */}
              <View style={styles.invitePillCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invitePillLabel}>INVITE CODE</Text>
                  <Text selectable style={styles.invitePillCode}>
                    {inviteCode}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.inviteCopyBtn, copiedCode && styles.inviteCopyBtnDone]}
                  onPress={() => copyInviteCode(inviteCode)}
                  activeOpacity={0.8}
                >
                  {copiedCode ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#6366F1" />}
                  <Text style={[styles.inviteCopyText, copiedCode && { color: '#10B981' }]}>
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

              {/* IUT Hall & Room Badge */}
              {(group.room?.roomNumber || group.roomNumber) && (
                <View style={styles.hallCard}>
                  <View style={styles.hallIconBox}>
                    <Text style={{ fontSize: 20 }}>🏛️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.hallTitle}>Official IUT Hall Assignment</Text>
                    <Text style={styles.hallNumber}>
                      {group.room?.roomNumber || group.roomNumber}
                    </Text>
                    <Text style={styles.hallStatus}>Confirmed by Provost & Residence Office</Text>
                  </View>
                </View>
              )}

              {/* Roommate Members List */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>SQUAD MEMBERS</Text>
                  <Text style={styles.sectionHeaderCount}>
                    {(group.members || []).length}/{group.maxSize || 4} Roommates
                  </Text>
                </View>

                {(group.members || []).map((member: any) => (
                  <View key={member.id} style={styles.memberCard}>
                    <TouchableOpacity
                      style={styles.memberInfoCol}
                      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: member.id } })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {(member.name || 'U').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          {member.studentId ? (
                            <View style={styles.studentIdBadgeMini}>
                              <Text style={styles.studentIdBadgeMiniText}>ID: {member.studentId}</Text>
                            </View>
                          ) : null}
                        </View>
                        <RatingLine
                          average={member.rating?.average || 0}
                          count={member.rating?.count || 0}
                          size={12}
                        />
                      </View>
                    </TouchableOpacity>

                  <View style={styles.memberActionsRow}>
                    <TouchableOpacity
                      style={styles.reviewPillBtn}
                      onPress={() => openReview(member)}
                      activeOpacity={0.75}
                    >
                      <Star
                        size={13}
                        color="#F59E0B"
                        fill={member.reviewedByMe ? '#F59E0B' : 'transparent'}
                      />
                      <Text style={styles.reviewPillText}>
                        {member.reviewedByMe ? 'Edit' : 'Review'}
                      </Text>
                    </TouchableOpacity>

                    {!group.isLocked && (
                      <TouchableOpacity
                        style={styles.removeMemberBtn}
                        onPress={() => handleRemoveMember(member)}
                        disabled={removingMemberId === member.id}
                        activeOpacity={0.75}
                      >
                        {removingMemberId === member.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <UserMinus size={15} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Add Roommate Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>INVITE BY EMAIL</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.modernInput, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                  value={memberEmail}
                  onChangeText={setMemberEmail}
                  placeholder="name@university.edu"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.addMemberSubmitBtn}
                  onPress={handleAddMember}
                  disabled={addingMember}
                  activeOpacity={0.8}
                >
                  {addingMember ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.addMemberSubmitText}>Invite</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Squad Actions */}
            <View style={styles.actionsContainer}>
              {!group.isLocked && (
                <TouchableOpacity
                  style={styles.lockSquadBtn}
                  onPress={handleLockGroup}
                  activeOpacity={0.85}
                >
                  <Lock size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.lockSquadBtnText}>Lock Squad & Finalize</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.leaveSquadBtn}
                onPress={handleLeaveGroup}
                activeOpacity={0.85}
              >
                <LogOut size={16} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.leaveSquadBtnText}>Leave Squad</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── NO GROUP: MODERN SQUAD CREATION STUDIO ── */
          <View style={styles.studioWrapper}>
            {/* Segmented Mode Switcher */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segmentBtn, mode === 'create' && styles.segmentBtnActive]}
                onPress={() => setMode('create')}
                activeOpacity={0.8}
              >
                <Sparkles
                  size={15}
                  color={mode === 'create' ? '#6366F1' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.segmentText, mode === 'create' && styles.segmentTextActive]}>
                  Create Squad
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, mode === 'join' && styles.segmentBtnActive]}
                onPress={() => setMode('join')}
                activeOpacity={0.8}
              >
                <Key
                  size={15}
                  color={mode === 'join' ? '#6366F1' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.segmentText, mode === 'join' && styles.segmentTextActive]}>
                  Join with Code
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'create' ? (
              <View style={styles.modernCard}>
                {/* Live Card Preview */}
                <View style={styles.previewBox}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.previewTitle} numberOfLines={1}>
                        {groupName.trim() ? groupName.trim() : 'Your Squad Name'}
                      </Text>
                      <View style={styles.previewBadgeRow}>
                        <ShieldCheck size={12} color="#10B981" />
                        <Text style={styles.previewBadgeText}>Verified Student Squad</Text>
                      </View>
                    </View>
                    <View style={styles.previewSlotPill}>
                      <Text style={styles.previewSlotText}>1/4 Slots</Text>
                    </View>
                  </View>
                </View>

                {/* 1. Emoji Selector */}
                <Text style={styles.fieldLabel}>CHOOSE SQUAD ICON</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.emojiRow}
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.emojiPill, selectedEmoji === emoji && styles.emojiPillActive]}
                      onPress={() => setSelectedEmoji(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* 2. Squad Name Input */}
                <Text style={styles.fieldLabel}>SQUAD NAME</Text>
                <TextInput
                  style={styles.modernInput}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g. Scholar Sanctuary, North Hall 404..."
                  placeholderTextColor="#94A3B8"
                />

                {/* 3. Quick Inspiration Chips */}
                <Text style={styles.fieldLabel}>POPULAR INSPIRATION</Text>
                <View style={styles.chipsGrid}>
                  {PRESET_IDEAS.map((idea, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.ideaChip}
                      onPress={() => {
                        setSelectedEmoji(idea.emoji);
                        setGroupName(idea.name);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
                      <View>
                        <Text style={styles.ideaTitle}>{idea.name}</Text>
                        <Text style={styles.ideaSub}>{idea.tag}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Submit Create Button */}
                <TouchableOpacity
                  style={styles.primaryGradientBtn}
                  onPress={handleCreateGroup}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryGradientBtnText}>Create Roommate Squad</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Join Mode */
              <View style={styles.modernCard}>
                <View style={styles.joinIconCenter}>
                  <View style={styles.joinKeyCircle}>
                    <Key size={30} color="#6366F1" />
                  </View>
                  <Text style={styles.joinTitle}>Have an Invite Code?</Text>
                  <Text style={styles.joinSub}>
                    Paste the 6-character code or full link from your future roommates to join their circle.
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>ENTER INVITE CODE</Text>
                <TextInput
                  style={[styles.modernInput, styles.joinCodeInput]}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="e.g. SQUAD-4829"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={styles.primaryGradientBtn}
                  onPress={handleJoinGroup}
                  disabled={joining}
                  activeOpacity={0.85}
                >
                  {joining ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Users size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryGradientBtnText}>Join Roommate Squad</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {reviewTarget && (
        <ReviewModal
          visible
          onClose={() => setReviewTarget(null)}
          revieweeId={reviewTarget.id}
          revieweeName={reviewTarget.name}
          existing={reviewExisting}
          onChanged={loadGroup}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusLocked: {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusOpenText: {
    color: '#059669',
  },
  statusLockedText: {
    color: '#334155',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 14,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },

  /* SQUAD CREATOR STUDIO */
  studioWrapper: {
    width: '100%',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
  },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 32,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  previewSlotPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  previewSlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  emojiRow: {
    flexDirection: 'row',
    paddingBottom: 12,
    gap: 8,
  },
  emojiPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
    transform: [{ scale: 1.08 }],
  },
  emojiText: {
    fontSize: 22,
  },
  modernInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 16,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  ideaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  ideaEmoji: {
    fontSize: 18,
  },
  ideaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  ideaSub: {
    fontSize: 10,
    color: '#64748B',
  },
  primaryGradientBtn: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 15,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryGradientBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* Join with code styles */
  joinIconCenter: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  joinKeyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  joinSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  joinCodeInput: {
    letterSpacing: 2,
    textAlign: 'center',
    fontSize: 18,
  },

  /* EXISTING SQUAD DASHBOARD */
  groupCardWrapper: {
    width: '100%',
    gap: 16,
  },
  squadHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  squadIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  squadHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  squadHeroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  invitePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  invitePillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  invitePillCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  inviteCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  inviteCopyBtnDone: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  inviteCopyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionHeaderCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  memberActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  reviewPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  removeMemberBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMemberSubmitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 16,
  },
  lockSquadBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
  },
  lockSquadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  leaveSquadBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  leaveSquadBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  hallCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginTop: 8,
  },
  hallIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hallTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hallNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#004D38',
    marginTop: 2,
  },
  hallStatus: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    fontWeight: '600',
  },
  studentIdBadgeMini: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  studentIdBadgeMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006A4E',
  },
});
