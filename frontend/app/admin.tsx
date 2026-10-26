import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Shield,
  Zap,
  Users,
  Home,
  Star,
  AlertTriangle,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  LogOut,
  ChevronRight,
  Trash2,
  CheckCircle2,
  X,
  Sliders,
  Check,
  XCircle,
  MessageSquare,
  Send,
  ExternalLink,
  MessageCircle,
} from 'lucide-react-native';
import { useAuth } from '../src/AuthContext';
import { Theme, shadow, type } from '../src/theme';
import { apiRequest } from '../src/api';
import { useLayout } from '../src/responsive';
import { Avatar, Button, Card, Content } from '../src/components/ui';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  compatibility: number;
  roomStatus: string;
  groupId?: string | null;
}

interface GroupSummary {
  id: string;
  name: string | null;
  roomNumber: string | null;
  isLocked: boolean;
  memberCount: number;
  members: { id: string; name: string; email: string; studentId?: string }[];
  averageCompatibility: number;
  flagged: boolean;
}

interface PairwiseScore {
  memberA: { id: string; name: string };
  memberB: { id: string; name: string };
  score: number;
  details: string[];
}

interface GroupDetails {
  id: string;
  name: string | null;
  room: { roomNumber: string } | null;
  isLocked: boolean;
  members: { id: string; name: string; email: string; studentId?: string; hasProfile: boolean }[];
  averageCompatibility: number;
  pairwise: PairwiseScore[];
}

interface GroupMessage {
  id: string;
  content: string;
  senderId: string;
  sender?: { id: string; name: string; role?: string };
  createdAt: string;
}

interface Review {
  id: string;
  author: { id: string; name: string; email: string };
  targetUser: { id: string; name: string; email: string };
  rating: number;
  relationship: string;
  comment: string;
  endorsements: string[];
  createdAt: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useLayout();
  const wide = width >= 900;

  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'students' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningAssignment, setRunningAssignment] = useState(false);

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Filters & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'FLAGGED' | 'LOCKED' | 'OPEN'>('ALL');

  // Pairwise Group Details Modal
  const [selectedGroup, setSelectedGroup] = useState<GroupDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Confirm Room Modal State
  const [confirmingGroup, setConfirmingGroup] = useState<GroupSummary | null>(null);
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Deny Room Modal State
  const [denyingGroup, setDenyingGroup] = useState<GroupSummary | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [dissolveGroupCheck, setDissolveGroupCheck] = useState(false);
  const [denySubmitting, setDenySubmitting] = useState(false);

  // Group Messaging / Broadcast Modal State
  const [chatGroup, setChatGroup] = useState<GroupSummary | null>(null);
  const [chatMessages, setChatMessages] = useState<GroupMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Assignment Result Modal
  const [assignmentResult, setAssignmentResult] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, groupsRes, reviewsRes] = await Promise.all([
        apiRequest('/api/admin/students'),
        apiRequest('/api/admin/groups'),
        apiRequest('/api/admin/reviews'),
      ]);

      if (studentsRes.response.ok && studentsRes.data) {
        setStudents(studentsRes.data);
      }
      if (groupsRes.response.ok && groupsRes.data) {
        setGroups(groupsRes.data);
      }
      if (reviewsRes.response.ok && reviewsRes.data) {
        const formattedReviews = (reviewsRes.data as any[]).map((r) => ({
          ...r,
          endorsements: Array.isArray(r.endorsements)
            ? r.endorsements
            : typeof r.endorsements === 'string'
            ? (() => {
                try {
                  return JSON.parse(r.endorsements);
                } catch {
                  return [];
                }
              })()
            : [],
        }));
        setReviews(formattedReviews);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── AUTO ASSIGNMENT ──
  const handleRunAutoAssignment = async () => {
    Alert.alert(
      'Run Auto-Assignment',
      'This will match unassigned students based on lifestyle compatibility (sleep, study habits, cleanliness, smoking, noise tolerance) and auto-assign them to available campus rooms. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Matching Algorithm',
          style: 'default',
          onPress: async () => {
            setRunningAssignment(true);
            try {
              const { response, data } = await apiRequest('/api/admin/run', {
                method: 'POST',
                body: {},
              });

              if (response.ok && data) {
                setAssignmentResult(data);
                await fetchData();
              } else {
                Alert.alert('Assignment Issue', data?.message || 'Could not complete auto-assignment.');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to connect to matching service.');
            } finally {
              setRunningAssignment(false);
            }
          },
        },
      ]
    );
  };

  // ── ROOM CONFIRMATION ──
  const openConfirmModal = (group: GroupSummary) => {
    setConfirmingGroup(group);
    setCustomRoomNumber(group.roomNumber || '');
  };

  const handleExecuteConfirm = async () => {
    if (!confirmingGroup) return;
    setConfirmSubmitting(true);
    try {
      const { response, data } = await apiRequest(`/api/admin/groups/${confirmingGroup.id}/confirm`, {
        method: 'POST',
        body: { roomNumber: customRoomNumber.trim() || undefined },
      });

      if (response.ok) {
        Alert.alert('Room Confirmed', 'The room assignment has been locked and confirmed. An official notice was sent to the roommates.');
        setConfirmingGroup(null);
        await fetchData();
      } else {
        Alert.alert('Error', data?.message || 'Could not confirm room assignment.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed while confirming room.');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  // ── ROOM DENIAL ──
  const openDenyModal = (group: GroupSummary) => {
    setDenyingGroup(group);
    setDenyReason('');
    setDissolveGroupCheck(false);
  };

  const handleExecuteDeny = async () => {
    if (!denyingGroup) return;
    setDenySubmitting(true);
    try {
      const { response, data } = await apiRequest(`/api/admin/groups/${denyingGroup.id}/deny`, {
        method: 'POST',
        body: {
          reason: denyReason.trim() || 'Administrative reassignment',
          dissolve: dissolveGroupCheck,
        },
      });

      if (response.ok) {
        Alert.alert(
          dissolveGroupCheck ? 'Group Dissolved' : 'Room Assignment Denied',
          dissolveGroupCheck
            ? 'The group has been dissolved. Students are now free to re-match.'
            : 'The room assignment was revoked and unlocked. The group remains pending.'
        );
        setDenyingGroup(null);
        await fetchData();
      } else {
        Alert.alert('Error', data?.message || 'Could not deny room assignment.');
      }
    } catch {
      Alert.alert('Error', 'Connection failed while denying room.');
    } finally {
      setDenySubmitting(false);
    }
  };

  // ── GROUP CHAT & BROADCAST ──
  const openChatModal = async (group: GroupSummary) => {
    setChatGroup(group);
    setChatLoading(true);
    setBroadcastText('');
    try {
      const { response, data } = await apiRequest(`/api/admin/groups/${group.id}/messages`);
      if (response.ok && Array.isArray(data)) {
        setChatMessages(data);
      }
    } catch (e) {
      console.warn('Error loading chat messages:', e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendAdminMessage = async () => {
    const text = broadcastText.trim();
    if (!text || !chatGroup) return;

    setSendingMessage(true);
    try {
      const { response, data } = await apiRequest(`/api/admin/groups/${chatGroup.id}/message`, {
        method: 'POST',
        body: { content: text },
      });

      if (response.ok && data) {
        setChatMessages((prev) => [...prev, data]);
        setBroadcastText('');
      } else {
        Alert.alert('Error', data?.message || 'Could not send message.');
      }
    } catch {
      Alert.alert('Error', 'Failed to transmit official message.');
    } finally {
      setSendingMessage(false);
    }
  };

  // ── PAIRWISE INSPECTION ──
  const openGroupDetails = async (groupId: string) => {
    setDetailsLoading(true);
    setSelectedGroup(null);
    try {
      const { response, data } = await apiRequest(`/api/admin/groups/${groupId}`);
      if (response.ok && data) {
        setSelectedGroup(data);
      } else {
        Alert.alert('Error', 'Could not load group compatibility details.');
      }
    } catch {
      Alert.alert('Error', 'Connection error while loading room details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // ── REVIEW DELETION ──
  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to remove this peer review from the platform? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { response } = await apiRequest(`/api/admin/reviews/${reviewId}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                setReviews((prev) => prev.filter((r) => r.id !== reviewId));
              } else {
                Alert.alert('Error', 'Could not delete review.');
              }
            } catch {
              Alert.alert('Error', 'Failed to delete review.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of the administration console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // KPIs
  const totalStudents = students.length;
  const assignedCount = students.filter((s) => s.roomStatus === 'Assigned').length;
  const unassignedCount = totalStudents - assignedCount;
  const totalRooms = groups.length;
  const flaggedRooms = groups.filter((g) => g.flagged || g.averageCompatibility < 65).length;
  const campusAvgCompat =
    groups.length > 0
      ? Math.round(groups.reduce((acc, g) => acc + (g.averageCompatibility || 0), 0) / groups.length)
      : 85;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()));
      if (!matchesSearch) return false;
      if (studentFilter === 'ASSIGNED') return s.roomStatus === 'Assigned';
      if (studentFilter === 'UNASSIGNED') return s.roomStatus !== 'Assigned';
      return true;
    });
  }, [students, studentSearch, studentFilter]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (roomFilter === 'FLAGGED') return g.flagged || g.averageCompatibility < 65;
      if (roomFilter === 'LOCKED') return g.isLocked;
      if (roomFilter === 'OPEN') return !g.isLocked;
      return true;
    });
  }, [groups, roomFilter]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Initializing IUT Hall Operations Command...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP COMMAND HEADER */}
      <View style={styles.headerHero}>
        <LinearGradient
          colors={['#004D38', '#006A4E', '#065F46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Content wide={wide} style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <View style={styles.adminBadge}>
              <Shield size={14} color="#FDE68A" />
              <Text style={styles.adminBadgeText}>IUT PROVOST & HALL COMMAND</Text>
            </View>

            <View style={styles.heroActions}>
              <Pressable
                onPress={() => router.push('/(tabs)')}
                style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
              >
                <Users size={15} color="#ECFDF5" />
                <Text style={styles.headerBtnText}>Student View</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.headerBtn, styles.headerBtnDanger, pressed && styles.pressed]}
              >
                <LogOut size={15} color="#FECACA" />
                <Text style={[styles.headerBtnText, { color: '#FECACA' }]}>Log Out</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroBrandingRow}>
            <Image
              source={require('../assets/iut_logo.png')}
              style={styles.heroLogo}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>IUT Hall & Residence</Text>
              <Text style={styles.heroSubtitle}>
                Gazipur, Dhaka • Hall Operations & Room Allocation
              </Text>
              <Text style={styles.heroAdminUser}>
                Provost Console: <Text style={{ fontWeight: '700', color: '#fff' }}>{user?.email || 'admin@iut-dhaka.edu'}</Text>
              </Text>
            </View>
          </View>

          {/* QUICK ACTION BAR */}
          <View style={styles.actionBanner}>
            <Pressable
              onPress={handleRunAutoAssignment}
              disabled={runningAssignment}
              style={({ pressed }) => [
                styles.runAssignBtn,
                runningAssignment && { opacity: 0.7 },
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.runAssignBtnGradient}
              >
                {runningAssignment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Zap size={18} color="#fff" />
                    <Text style={styles.runAssignBtnText}>Run AI Auto-Assignment</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            >
              <RefreshCw size={16} color="#E0E7FF" />
              <Text style={styles.refreshBtnText}>Sync Live</Text>
            </Pressable>
          </View>
        </Content>
      </View>

      {/* NAVIGATION TABS */}
      <View style={styles.tabsContainer}>
        <Content wide={wide}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {[
              { key: 'overview', label: 'Overview', icon: Sliders },
              { key: 'rooms', label: `Rooms (${groups.length})`, icon: Home },
              { key: 'students', label: `Students (${students.length})`, icon: Users },
              { key: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setActiveTab(t.key as any)}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <Icon size={16} color={active ? Theme.colors.primary : Theme.colors.textSecondary} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Content>
      </View>

      {/* MAIN CONTENT AREA */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Content wide={wide}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View>
              {/* STAT KPI CARDS */}
              <View style={styles.kpiGrid}>
                <Card style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Users size={22} color={Theme.colors.primary} />
                  </View>
                  <Text style={styles.kpiValue}>{totalStudents}</Text>
                  <Text style={styles.kpiLabel}>Enrolled Students</Text>
                  <Text style={styles.kpiSub}>
                    <Text style={{ color: Theme.colors.success, fontWeight: '700' }}>{assignedCount} assigned</Text> •{' '}
                    {unassignedCount} waiting
                  </Text>
                </Card>

                <Card style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Home size={22} color={Theme.colors.success} />
                  </View>
                  <Text style={styles.kpiValue}>{totalRooms}</Text>
                  <Text style={styles.kpiLabel}>Assigned Rooms</Text>
                  <Text style={styles.kpiSub}>
                    {groups.filter((g) => g.isLocked).length} locked • {groups.filter((g) => !g.isLocked).length} open
                  </Text>
                </Card>

                <Card style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Zap size={22} color="#D97706" />
                  </View>
                  <Text style={styles.kpiValue}>{campusAvgCompat}%</Text>
                  <Text style={styles.kpiLabel}>Avg Compatibility</Text>
                  <Text style={styles.kpiSub}>Campus lifestyle average</Text>
                </Card>

                <Card style={styles.kpiCard}>
                  <View
                    style={[
                      styles.kpiIconBox,
                      { backgroundColor: flaggedRooms > 0 ? '#FEE2E2' : '#F3F4F6' },
                    ]}
                  >
                    <AlertTriangle
                      size={22}
                      color={flaggedRooms > 0 ? Theme.colors.error : Theme.colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.kpiValue, flaggedRooms > 0 && { color: Theme.colors.error }]}>
                    {flaggedRooms}
                  </Text>
                  <Text style={styles.kpiLabel}>Conflict Alerts</Text>
                  <Text style={styles.kpiSub}>Rooms below 65% match</Text>
                </Card>
              </View>

              {/* AT-RISK ROOMS ALERT BANNER IF ANY */}
              {flaggedRooms > 0 && (
                <Card style={styles.alertCard}>
                  <View style={styles.alertCardRow}>
                    <AlertTriangle size={24} color={Theme.colors.error} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.alertCardTitle}>{flaggedRooms} Room(s) Need Admin Attention</Text>
                      <Text style={styles.alertCardText}>
                        Potential roommate lifestyle friction detected based on sleep schedules, study noise, or
                        cleanliness. Tap to inspect, confirm, or deny.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setRoomFilter('FLAGGED');
                        setActiveTab('rooms');
                      }}
                      style={styles.alertCardBtn}
                    >
                      <Text style={styles.alertCardBtnText}>Review</Text>
                    </Pressable>
                  </View>
                </Card>
              )}

              {/* QUICK HIGHLIGHTS */}
              <View style={styles.sectionBlock}>
                <Text style={type.heading}>Active Room Assignments & Direct Controls</Text>
                <Text style={[type.secondary, { marginBottom: 16 }]}>
                  Approve/confirm assignments, deny conflicts, or broadcast official messages to groups.
                </Text>

                {groups.slice(0, 4).map((g) => (
                  <Card key={g.id} style={styles.roomSummaryCard}>
                    <View style={styles.roomSummaryHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.roomTitleRow}>
                          <Text style={styles.roomTitle}>
                            {g.roomNumber ? `Room ${g.roomNumber}` : 'Pending Room'}
                          </Text>
                          {g.isLocked ? (
                            <View style={[styles.badgePill, { backgroundColor: '#DCFCE7' }]}>
                              <Lock size={12} color="#15803D" />
                              <Text style={[styles.badgeText, { color: '#15803D' }]}>Confirmed & Locked</Text>
                            </View>
                          ) : (
                            <View style={[styles.badgePill, { backgroundColor: '#FEF3C7' }]}>
                              <Unlock size={12} color="#B45309" />
                              <Text style={[styles.badgeText, { color: '#B45309' }]}>Pending Approval</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.roomSub}>{g.name || 'Room Group'}</Text>
                      </View>

                      <View
                        style={[
                          styles.compatGauge,
                          {
                            backgroundColor:
                              g.averageCompatibility >= 75
                                ? Theme.colors.successSoft
                                : g.averageCompatibility >= 60
                                ? '#FEF3C7'
                                : Theme.colors.errorSoft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.compatGaugeText,
                            {
                              color:
                                g.averageCompatibility >= 75
                                ? Theme.colors.success
                                : g.averageCompatibility >= 60
                                ? '#D97706'
                                : Theme.colors.error,
                            },
                          ]}
                        >
                          {g.averageCompatibility}%
                        </Text>
                        <Text style={styles.compatGaugeSub}>match</Text>
                      </View>
                    </View>

                    {/* Member Avatars */}
                    <View style={styles.memberAvatarRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {g.members.map((m, idx) => (
                          <View key={m.id} style={[styles.stackedAvatar, { marginLeft: idx > 0 ? -10 : 0 }]}>
                            <Avatar name={m.name} size={30} />
                          </View>
                        ))}
                      </View>
                      <Text style={styles.memberNamesText} numberOfLines={1}>
                        {g.members.map((m) => m.name).join(', ')}
                      </Text>
                    </View>

                    {/* ROOM ACTIONS BAR */}
                    <View style={styles.cardActionsRow}>
                      <Pressable
                        onPress={() => openConfirmModal(g)}
                        style={[styles.actionBtn, styles.confirmActionBtn]}
                      >
                        <Check size={14} color="#fff" />
                        <Text style={styles.confirmActionBtnText}>Confirm Room</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => openDenyModal(g)}
                        style={[styles.actionBtn, styles.denyActionBtn]}
                      >
                        <XCircle size={14} color="#EF4444" />
                        <Text style={styles.denyActionBtnText}>Deny / Reassign</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => openChatModal(g)}
                        style={[styles.actionBtn, styles.chatActionBtn]}
                      >
                        <MessageSquare size={14} color={Theme.colors.primary} />
                        <Text style={styles.chatActionBtnText}>Write to Group</Text>
                      </Pressable>
                    </View>
                  </Card>
                ))}

                <Button
                  title="Manage All Rooms & Pairwise Breakdown"
                  variant="secondary"
                  onPress={() => setActiveTab('rooms')}
                  style={{ marginTop: 12 }}
                />
              </View>
            </View>
          )}

          {/* TAB 2: ROOMS */}
          {activeTab === 'rooms' && (
            <View>
              {/* Filter Pills */}
              <View style={styles.filterPillsRow}>
                {[
                  { key: 'ALL', label: `All Rooms (${groups.length})` },
                  { key: 'FLAGGED', label: `⚠️ Conflicts (${flaggedRooms})` },
                  { key: 'LOCKED', label: `Confirmed (${groups.filter((g) => g.isLocked).length})` },
                  { key: 'OPEN', label: `Pending (${groups.filter((g) => !g.isLocked).length})` },
                ].map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setRoomFilter(f.key as any)}
                    style={[styles.filterChip, roomFilter === f.key && styles.filterChipActive]}
                  >
                    <Text
                      style={[styles.filterChipText, roomFilter === f.key && styles.filterChipTextActive]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {filteredGroups.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Home size={40} color={Theme.colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Rooms Match This Filter</Text>
                  <Text style={styles.emptySubtitle}>
                    Run the Auto-Assignment engine or adjust your filter selection above.
                  </Text>
                </Card>
              ) : (
                filteredGroups.map((g) => (
                  <Card key={g.id} style={styles.roomSummaryCard}>
                    <View style={styles.roomSummaryHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.roomTitleRow}>
                          <Text style={styles.roomTitle}>
                            {g.roomNumber ? `Room ${g.roomNumber}` : 'Pending Room Assignment'}
                          </Text>
                          {g.flagged && (
                            <View style={[styles.badgePill, { backgroundColor: Theme.colors.errorSoft }]}>
                              <AlertTriangle size={12} color={Theme.colors.error} />
                              <Text style={[styles.badgeText, { color: Theme.colors.error }]}>Conflict</Text>
                            </View>
                          )}
                          {g.isLocked ? (
                            <View style={[styles.badgePill, { backgroundColor: '#DCFCE7' }]}>
                              <Lock size={12} color="#15803D" />
                              <Text style={[styles.badgeText, { color: '#15803D' }]}>Confirmed</Text>
                            </View>
                          ) : (
                            <View style={[styles.badgePill, { backgroundColor: '#FEF3C7' }]}>
                              <Unlock size={12} color="#B45309" />
                              <Text style={[styles.badgeText, { color: '#B45309' }]}>Pending</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.roomSub}>{g.name || 'Room Group'}</Text>
                      </View>

                      <View
                        style={[
                          styles.compatGauge,
                          {
                            backgroundColor:
                              g.averageCompatibility >= 75
                                ? Theme.colors.successSoft
                                : g.averageCompatibility >= 60
                                ? '#FEF3C7'
                                : Theme.colors.errorSoft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.compatGaugeText,
                            {
                              color:
                                g.averageCompatibility >= 75
                                ? Theme.colors.success
                                : g.averageCompatibility >= 60
                                ? '#D97706'
                                : Theme.colors.error,
                            },
                          ]}
                        >
                          {g.averageCompatibility}%
                        </Text>
                        <Text style={styles.compatGaugeSub}>match</Text>
                      </View>
                    </View>

                    {/* Roommates list */}
                    <View style={styles.roomMembersList}>
                      {g.members.map((m) => (
                        <View key={m.id} style={styles.roomMemberRow}>
                          <Avatar name={m.name} size={28} />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.roomMemberName}>{m.name}</Text>
                              {m.studentId ? (
                                <View style={styles.studentIdBadgeMini}>
                                  <Text style={styles.studentIdBadgeMiniText}>ID: {m.studentId}</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.roomMemberEmail}>{m.email}</Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* CARD CONTROLS: CONFIRM / DENY / WRITE / INSPECT */}
                    <View style={styles.cardActionsRow}>
                      <Pressable
                        onPress={() => openConfirmModal(g)}
                        style={[styles.actionBtn, styles.confirmActionBtn]}
                      >
                        <Check size={14} color="#fff" />
                        <Text style={styles.confirmActionBtnText}>Confirm Room</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => openDenyModal(g)}
                        style={[styles.actionBtn, styles.denyActionBtn]}
                      >
                        <XCircle size={14} color="#EF4444" />
                        <Text style={styles.denyActionBtnText}>Deny Room</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => openChatModal(g)}
                        style={[styles.actionBtn, styles.chatActionBtn]}
                      >
                        <MessageSquare size={14} color={Theme.colors.primary} />
                        <Text style={styles.chatActionBtnText}>Write to Group</Text>
                      </Pressable>
                    </View>

                    <Pressable onPress={() => openGroupDetails(g.id)} style={styles.inspectBtnRow}>
                      <Text style={styles.inspectBtnText}>Inspect Full Pairwise Breakdown</Text>
                      <ChevronRight size={16} color={Theme.colors.primary} />
                    </Pressable>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* TAB 3: STUDENTS ROSTER */}
          {activeTab === 'students' && (
            <View>
              {/* Search Box */}
              <View style={styles.searchBox}>
                <Search size={18} color={Theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search student by name or university email..."
                  placeholderTextColor={Theme.colors.textMuted}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                />
                {!!studentSearch && (
                  <Pressable onPress={() => setStudentSearch('')}>
                    <X size={16} color={Theme.colors.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* Status Filters */}
              <View style={styles.filterPillsRow}>
                {[
                  { key: 'ALL', label: `All (${students.length})` },
                  { key: 'ASSIGNED', label: `Assigned (${assignedCount})` },
                  { key: 'UNASSIGNED', label: `Unassigned (${unassignedCount})` },
                ].map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => setStudentFilter(f.key as any)}
                    style={[styles.filterChip, studentFilter === f.key && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        studentFilter === f.key && styles.filterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Users size={40} color={Theme.colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Students Found</Text>
                  <Text style={styles.emptySubtitle}>Try searching with a different term.</Text>
                </Card>
              ) : (
                filteredStudents.map((s) => (
                  <Card key={s.id} style={styles.studentCard}>
                    <View style={styles.studentCardRow}>
                      <Avatar name={s.name} size={44} />
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                            <Text style={styles.studentName}>{s.name}</Text>
                            {s.studentId ? (
                              <View style={styles.studentIdBadge}>
                                <Text style={styles.studentIdBadgeText}>ID: {s.studentId}</Text>
                              </View>
                            ) : null}
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  s.roomStatus === 'Assigned'
                                    ? Theme.colors.successSoft
                                    : '#FEF3C7',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color:
                                    s.roomStatus === 'Assigned'
                                      ? Theme.colors.success
                                      : '#B45309',
                                },
                              ]}
                            >
                              {s.roomStatus}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.studentEmail}>{s.email}</Text>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* TAB 4: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <View>
              <Text style={[type.heading, { marginBottom: 6 }]}>Peer Review Moderation</Text>
              <Text style={[type.secondary, { marginBottom: 16 }]}>
                Review student feedback and endorsements. Ensure compliance with university community standards.
              </Text>

              {reviews.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Star size={40} color={Theme.colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Reviews Posted Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    When roommates rate their living experience, moderation items will appear here.
                  </Text>
                </Card>
              ) : (
                reviews.map((r) => (
                  <Card key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewRelation}>{r.relationship || 'Campus Roommate'}</Text>
                        <Text style={styles.reviewAuthor}>
                          <Text style={{ fontWeight: '700' }}>{r.author?.name || 'Student'}</Text> reviewing{' '}
                          <Text style={{ fontWeight: '700' }}>{r.targetUser?.name || 'Peer'}</Text>
                        </Text>
                      </View>

                      <View style={styles.reviewRatingBox}>
                        <Star size={16} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.reviewRatingText}>{r.rating} / 5</Text>
                      </View>
                    </View>

                    {/* Endorsements tags */}
                    {r.endorsements && r.endorsements.length > 0 && (
                      <View style={styles.endorsementsRow}>
                        {r.endorsements.map((tag, idx) => (
                          <View key={idx} style={styles.endorsementPill}>
                            <Text style={styles.endorsementPillText}>✓ {tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.reviewComment}>"{r.comment}"</Text>

                    <View style={styles.reviewFooter}>
                      <Text style={styles.reviewDate}>
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>

                      <Pressable
                        onPress={() => handleDeleteReview(r.id)}
                        style={({ pressed }) => [styles.deleteReviewBtn, pressed && styles.pressed]}
                      >
                        <Trash2 size={14} color={Theme.colors.error} />
                        <Text style={styles.deleteReviewBtnText}>Delete Inappropriate Review</Text>
                      </Pressable>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}
        </Content>
      </ScrollView>

      {/* ── MODAL: CONFIRM ROOM ── */}
      <Modal visible={!!confirmingGroup} animationType="fade" transparent onRequestClose={() => setConfirmingGroup(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, wide && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Confirm Room Assignment</Text>
                <Text style={styles.modalSub}>{confirmingGroup?.name || 'Room Group'}</Text>
              </View>
              <Pressable onPress={() => setConfirmingGroup(null)} style={styles.closeBtn}>
                <X size={20} color={Theme.colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalBodyText}>
              Confirming will lock this room group and post an official Housing Notice into their group chat.
            </Text>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Assigned Room Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 101, 204, South Hall 3B"
                placeholderTextColor={Theme.colors.textMuted}
                value={customRoomNumber}
                onChangeText={setCustomRoomNumber}
              />
            </View>

            <View style={{ marginTop: 14, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 13, color: '#166534', lineHeight: 18 }}>
                ✓ Roommates: <Text style={{ fontWeight: '700' }}>{confirmingGroup?.members.map(m => m.name).join(', ')}</Text>
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setConfirmingGroup(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm & Lock Room"
                variant="primary"
                loading={confirmSubmitting}
                onPress={handleExecuteConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: DENY ROOM ── */}
      <Modal visible={!!denyingGroup} animationType="fade" transparent onRequestClose={() => setDenyingGroup(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, wide && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: Theme.colors.error }]}>Deny Room Assignment</Text>
                <Text style={styles.modalSub}>{denyingGroup?.name || 'Room Group'}</Text>
              </View>
              <Pressable onPress={() => setDenyingGroup(null)} style={styles.closeBtn}>
                <X size={20} color={Theme.colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalBodyText}>
              Revoke this room allocation. An official Housing Notice will be delivered to the students.
            </Text>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Denial Reason (Shared with Students)</Text>
              <TextInput
                style={[styles.modalInput, { height: 72, textAlignVertical: 'top' }]}
                placeholder="e.g. Incompatible sleep schedule, building maintenance, capacity adjustment..."
                placeholderTextColor={Theme.colors.textMuted}
                multiline
                value={denyReason}
                onChangeText={setDenyReason}
              />
            </View>

            {/* Dissolve Group Checkbox */}
            <Pressable
              onPress={() => setDissolveGroupCheck((prev) => !prev)}
              style={styles.dissolveRow}
            >
              <View style={[styles.checkboxBox, dissolveGroupCheck && styles.checkboxBoxChecked]}>
                {dissolveGroupCheck && <Check size={12} color="#fff" />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.dissolveTitle}>Dissolve Group Completely</Text>
                <Text style={styles.dissolveSub}>
                  Unlinks all roommates so they can match individually. If unchecked, the group remains together in pending status.
                </Text>
              </View>
            </Pressable>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setDenyingGroup(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Execute Denial"
                variant="danger"
                loading={denySubmitting}
                onPress={handleExecuteDeny}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: WRITE TO GROUP & CHAT BROADCAST ── */}
      <Modal visible={!!chatGroup} animationType="slide" transparent onRequestClose={() => setChatGroup(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, wide && { maxWidth: 640 }, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Shield size={16} color={Theme.colors.primary} />
                  <Text style={styles.modalTitle}>Official Group Channel</Text>
                </View>
                <Text style={styles.modalSub}>
                  {chatGroup?.name} • {chatGroup?.roomNumber ? `Room ${chatGroup.roomNumber}` : 'Pending Room'}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  const g = chatGroup;
                  setChatGroup(null);
                  if (g) {
                    router.push({
                      pathname: '/chat/[id]',
                      params: { id: g.id, name: g.name || 'Roommates', isGroup: 'true' },
                    });
                  }
                }}
                style={styles.openLiveBtn}
              >
                <MessageCircle size={15} color={Theme.colors.primary} />
                <Text style={styles.openLiveBtnText}>Live Chat</Text>
              </Pressable>

              <Pressable onPress={() => setChatGroup(null)} style={styles.closeBtn}>
                <X size={20} color={Theme.colors.text} />
              </Pressable>
            </View>

            {/* Quick preset notice chips */}
            <View style={styles.presetChipsRow}>
              {[
                '🏛️ Room confirmed by Housing!',
                '⚠️ Quiet hours start at 10 PM.',
                '📋 Roommate agreement required.',
              ].map((preset, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setBroadcastText(preset)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </Pressable>
              ))}
            </View>

            {/* Messages Scroll */}
            <ScrollView style={styles.chatScrollArea} showsVerticalScrollIndicator={false}>
              {chatLoading ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                  <Text style={{ marginTop: 8, color: Theme.colors.textSecondary }}>Syncing channel history...</Text>
                </View>
              ) : chatMessages.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{ color: Theme.colors.textMuted, fontStyle: 'italic' }}>
                    No messages in this room yet. Write the first official announcement below.
                  </Text>
                </View>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isAdminNotice =
                    msg.sender?.role === 'ADMIN' ||
                    msg.sender?.name?.includes('Admin') ||
                    msg.content.startsWith('🏛️') ||
                    msg.content.startsWith('⚠️');

                  return (
                    <View
                      key={msg.id || idx}
                      style={[
                        styles.msgBubbleWrap,
                        isAdminNotice ? styles.msgBubbleAdmin : styles.msgBubbleStudent,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text
                          style={[
                            styles.msgAuthorText,
                            isAdminNotice && { color: Theme.colors.primary, fontWeight: '800' },
                          ]}
                        >
                          {isAdminNotice ? '🛡️ University Housing' : msg.sender?.name || 'Student'}
                        </Text>
                        <Text style={styles.msgDateText}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={[styles.msgBodyText, isAdminNotice && styles.msgBodyTextAdmin]}>
                        {msg.content}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="Write official message / broadcast to this group..."
                placeholderTextColor={Theme.colors.textMuted}
                value={broadcastText}
                onChangeText={setBroadcastText}
                multiline
                maxLength={1000}
              />
              <Pressable
                onPress={handleSendAdminMessage}
                disabled={!broadcastText.trim() || sendingMessage}
                style={[
                  styles.sendAdminBtn,
                  (!broadcastText.trim() || sendingMessage) && { opacity: 0.5 },
                ]}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={18} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL: PAIRWISE COMPATIBILITY ── */}
      <Modal
        visible={!!selectedGroup || detailsLoading}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, wide && { maxWidth: 640 }]}>
            {detailsLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={{ marginTop: 12, color: Theme.colors.textSecondary }}>Loading pairwise breakdown...</Text>
              </View>
            ) : selectedGroup ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>
                      {selectedGroup.room ? `Room ${selectedGroup.room.roomNumber}` : 'Unassigned Room'}
                    </Text>
                    <Text style={styles.modalSub}>{selectedGroup.name || 'Room Group'}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedGroup(null)} style={styles.closeBtn}>
                    <X size={20} color={Theme.colors.text} />
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                  {/* Average Banner */}
                  <View style={styles.modalCompatBanner}>
                    <Text style={styles.modalCompatBannerLabel}>Average Roommate Match</Text>
                    <Text style={styles.modalCompatBannerVal}>{selectedGroup.averageCompatibility}%</Text>
                  </View>

                  {/* Members */}
                  <Text style={[type.heading, { marginTop: 16, marginBottom: 8 }]}>Assigned Roommates</Text>
                  {selectedGroup.members.map((m) => (
                    <View key={m.id} style={styles.modalMemberRow}>
                      <Avatar name={m.name} size={32} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.roomMemberName}>{m.name}</Text>
                        <Text style={styles.roomMemberEmail}>{m.email}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Pairwise Breakdowns */}
                  <Text style={[type.heading, { marginTop: 24, marginBottom: 8 }]}>
                    Pairwise Compatibility Breakdown
                  </Text>
                  {selectedGroup.pairwise && selectedGroup.pairwise.length > 0 ? (
                    selectedGroup.pairwise.map((p, idx) => (
                      <View key={idx} style={styles.pairwiseCard}>
                        <View style={styles.pairwiseHeader}>
                          <Text style={styles.pairwiseNames}>
                            {p.memberA.name} & {p.memberB.name}
                          </Text>
                          <View
                            style={[
                              styles.pairwiseBadge,
                              {
                                backgroundColor:
                                  p.score >= 75
                                    ? Theme.colors.successSoft
                                    : p.score >= 60
                                    ? '#FEF3C7'
                                    : Theme.colors.errorSoft,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pairwiseBadgeText,
                                {
                                  color:
                                    p.score >= 75
                                      ? Theme.colors.success
                                      : p.score >= 60
                                      ? '#D97706'
                                      : Theme.colors.error,
                                },
                              ]}
                            >
                              {p.score}%
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pairwiseDetailsList}>
                          {p.details.map((detail, dIdx) => (
                            <View key={dIdx} style={styles.pairwiseDetailRow}>
                              <Text style={styles.pairwiseDetailDot}>•</Text>
                              <Text style={styles.pairwiseDetailText}>{detail}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noPairwiseText}>
                      Insufficient members with lifestyle profiles to compute pairwise breakdown.
                    </Text>
                  )}
                </ScrollView>

                <Button
                  title="Close Details"
                  variant="secondary"
                  onPress={() => setSelectedGroup(null)}
                  style={{ marginTop: 16 }}
                />
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ── MODAL: AUTO ASSIGNMENT SUCCESS ── */}
      <Modal
        visible={!!assignmentResult}
        animationType="fade"
        transparent
        onRequestClose={() => setAssignmentResult(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, wide && { maxWidth: 540 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={styles.successIconBox}>
                <CheckCircle2 size={36} color={Theme.colors.success} />
              </View>
              <Text style={styles.successModalTitle}>Auto-Assignment Complete!</Text>
              <Text style={styles.successModalText}>
                The RoomSync lifestyle matching algorithm has grouped and assigned students into optimal campus
                rooms.
              </Text>
            </View>

            {assignmentResult?.assignments && (
              <View style={styles.successStatsBox}>
                <Text style={styles.successStatsText}>
                  • Groups Placed: <Text style={{ fontWeight: '700' }}>{assignmentResult.assignments.length}</Text>
                </Text>
                <Text style={styles.successStatsText}>
                  • Remaining Unmatched: <Text style={{ fontWeight: '700' }}>{assignmentResult.remainingUnmatched || 0}</Text>
                </Text>
              </View>
            )}

            <Button
              title="View Updated Rooms"
              onPress={() => {
                setAssignmentResult(null);
                setActiveTab('rooms');
              }}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#004D38',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  headerHero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroContent: {
    width: '100%',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBrandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  heroLogo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  heroAdminUser: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 3,
  },
  studentIdBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  studentIdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006A4E',
  },
  studentIdBadgeMini: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  studentIdBadgeMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006A4E',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#E0E7FF',
    marginLeft: 6,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 6,
  },
  headerBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E0E7FF',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 2,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },
  runAssignBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    ...shadow.md,
  },
  runAssignBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  runAssignBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    gap: 8,
  },
  refreshBtnText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Theme.colors.primarySoft,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  tabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
  },
  kpiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 20,
    padding: 16,
  },
  alertCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.error,
  },
  alertCardText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 18,
  },
  alertCardBtn: {
    backgroundColor: Theme.colors.error,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  alertCardBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    marginTop: 10,
  },
  roomSummaryCard: {
    marginBottom: 14,
    padding: 16,
  },
  roomSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  roomSub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  compatGauge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  compatGaugeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  compatGaugeSub: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: Theme.colors.textMuted,
  },
  memberAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
  },
  memberNamesText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginLeft: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 5,
  },
  confirmActionBtn: {
    backgroundColor: '#10B981',
  },
  confirmActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  denyActionBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  denyActionBtnText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  chatActionBtn: {
    backgroundColor: Theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  chatActionBtnText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  inspectBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 4,
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  roomMembersList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: 8,
  },
  roomMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomMemberName: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  roomMemberEmail: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
  },
  studentCard: {
    marginBottom: 10,
    padding: 14,
  },
  studentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  studentEmail: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewCard: {
    marginBottom: 12,
    padding: 16,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reviewRelation: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
  },
  reviewAuthor: {
    fontSize: 14,
    color: Theme.colors.text,
    marginTop: 2,
  },
  reviewRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  endorsementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  endorsementPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  endorsementPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  reviewComment: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Theme.colors.text,
    marginTop: 10,
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  reviewDate: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  deleteReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteReviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.error,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  modalSub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  modalBodyText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: Theme.colors.text,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  dissolveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: Theme.colors.error,
  },
  dissolveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  dissolveSub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },
  openLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    marginRight: 6,
  },
  openLiveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  chatScrollArea: {
    height: 240,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  msgBubbleWrap: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  msgBubbleAdmin: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  msgBubbleStudent: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  msgAuthorText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  msgDateText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  msgBodyText: {
    fontSize: 13,
    color: Theme.colors.text,
    lineHeight: 18,
  },
  msgBodyTextAdmin: {
    color: '#1E1B4B',
    fontWeight: '600',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Theme.colors.text,
    maxHeight: 80,
  },
  sendAdminBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  modalCompatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.primarySoft,
    padding: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  modalCompatBannerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  modalCompatBannerVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  modalMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pairwiseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  pairwiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pairwiseNames: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  pairwiseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pairwiseBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pairwiseDetailsList: {
    marginTop: 8,
    gap: 4,
  },
  pairwiseDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pairwiseDetailDot: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginRight: 6,
  },
  pairwiseDetailText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  noPairwiseText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  successModalText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  successStatsBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    gap: 6,
  },
  successStatsText: {
    fontSize: 13,
    color: Theme.colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
