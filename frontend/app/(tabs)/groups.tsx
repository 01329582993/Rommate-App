import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserPlus, Lock, Copy, LogIn, UserMinus } from 'lucide-react-native';
import { Theme } from '../../src/theme';
import { addMemberToGroup, createGroup, getMyGroup, joinGroup, lockGroup, removeMemberFromGroup, leaveGroup } from '../../src/groupApi';
import { LogOut } from 'lucide-react-native';

export default function GroupsScreen() {
  const [groupName, setGroupName] = useState('Roommate Circle');
  const [joinCode, setJoinCode] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      const { response, data } = await getMyGroup();
      if (response.ok && data?.id) {
        setGroup(data);
      } else {
        setGroup(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Group name required', 'Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      console.log('Creating group with name:', groupName.trim());
      const { response, data } = await createGroup(groupName.trim());
      console.log('Response status:', response.status, 'Data:', data);
      
      if (response.ok) {
        Alert.alert('Success', 'Group created');
        await loadGroup();
      } else {
        const errorMsg = data?.message || data?.error || 'Please try again';
        console.error('Create group error:', errorMsg);
        Alert.alert('Unable to create group', String(errorMsg));
      }
    } catch (error: any) {
      console.error('Create group exception:', error);
      Alert.alert('Error', error?.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    let cleanCode = joinCode.trim();
    if (!cleanCode) {
      Alert.alert('Invite code required', 'Enter the group invite code to join');
      return;
    }

    // If a full link is pasted, extract the code parameter
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
        Alert.alert('Joined', 'You joined the group');
        setJoinCode('');
        await loadGroup();
      } else {
        Alert.alert('Unable to join', data?.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not join group');
    } finally {
      setJoining(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      Alert.alert('Email required', 'Enter a roommate email to add');
      return;
    }

    setAddingMember(true);
    try {
      const { response, data } = await addMemberToGroup(memberEmail.trim());
      if (response.ok) {
        Alert.alert('Added', 'Member invited to your group');
        setMemberEmail('');
        await loadGroup();
      } else {
        Alert.alert('Unable to add member', data?.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (member: any) => {
    if (!member?.email && !member?.id) {
      return;
    }

    Alert.alert('Remove member?', `Remove ${member.name} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingMemberId(member.id);
          try {
            const { response, data } = await removeMemberFromGroup(member.email || member.id);
            if (response.ok) {
              await loadGroup();
            } else {
              Alert.alert('Unable to remove member', data?.message || 'Please try again');
            }
          } catch (error) {
            Alert.alert('Error', 'Could not remove member');
          } finally {
            setRemovingMemberId(null);
          }
        }
      }
    ]);
  };

  const handleLockGroup = async () => {
    try {
      const { response, data } = await lockGroup();
      if (response.ok) {
        Alert.alert('Locked', 'Your group is now locked.');
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
      'Leave Group',
      'Are you sure you want to leave this group? If you are the last member, this group will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { response, data } = await leaveGroup();
              if (response.ok) {
                Alert.alert('Success', 'You left the group');
                await loadGroup();
              } else {
                Alert.alert('Unable to leave group', data?.message || 'Please try again');
              }
            } catch (error) {
              Alert.alert('Error', 'Could not leave group');
            }
          }
        }
      ]
    );
  };

  const inviteCode = group?.inviteCode || group?.id || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Group</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateGroup}>
          <UserPlus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your group...</Text>
          </View>
        ) : group ? (
          <View style={styles.groupCard}>
            <View style={styles.iconCircle}>
              <Users size={40} color={Theme.colors.primary} />
            </View>
            <Text style={styles.groupName}>{group.name || 'My Group'}</Text>
            <Text style={styles.groupStatus}>{group.isLocked ? 'Locked and ready' : 'Open for roommates'}</Text>

            <View style={styles.inviteBox}>
              <Text style={styles.sectionLabel}>Invite code</Text>
              <Text selectable style={styles.inviteCode}>{inviteCode}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert('Invite code copied', inviteCode)}>
                <Copy size={16} color={Theme.colors.primary} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Members</Text>
              {(group.members || []).map((member: any) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMeta}>{member.profile?.bio || 'Roommate'}</Text>
                  </View>
                  {!group.isLocked && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveMember(member)} disabled={removingMemberId === member.id}>
                      {removingMemberId === member.id ? <ActivityIndicator size="small" color="#fff" /> : <UserMinus size={16} color="#fff" />}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Add a roommate</Text>
              <TextInput
                style={styles.input}
                value={memberEmail}
                onChangeText={setMemberEmail}
                placeholder="Enter roommate email"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.button} onPress={handleAddMember} disabled={addingMember}>
                {addingMember ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Member</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Join another group</Text>
              <TextInput
                style={styles.input}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Paste invite code"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.secondaryButton} onPress={handleJoinGroup} disabled={joining}>
                {joining ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.secondaryButtonText}>Join Group</Text>}
              </TouchableOpacity>
            </View>

            {!group.isLocked && (
              <TouchableOpacity style={styles.lockButton} onPress={handleLockGroup}>
                <Lock size={18} color="#fff" />
                <Text style={styles.buttonText}>Lock Group</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
              <LogOut size={18} color="#fff" />
              <Text style={styles.buttonText}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Users size={40} color={Theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Group Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a group, join one with an invite code, or add roommates by email.
            </Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name"
            />
            <TouchableOpacity style={styles.button} onPress={handleCreateGroup} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create a Group</Text>}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Paste invite code"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={handleJoinGroup} disabled={joining}>
              {joining ? <ActivityIndicator color={Theme.colors.primary} /> : <Text style={styles.secondaryButtonText}>Join with Invite Code</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  createBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: 20, paddingTop: 6 },
  emptyState: { alignItems: 'center', paddingBottom: 100 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10 },
  emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#dfe5ee', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, backgroundColor: '#fff' },
  button: { backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '100%' },
  secondaryButton: { backgroundColor: '#eef4ff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '100%', borderWidth: 1, borderColor: '#dfe7f7' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButtonText: { color: Theme.colors.primary, fontSize: 16, fontWeight: 'bold' },
  loadingBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { marginTop: 10, color: '#666' },
  groupCard: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  groupName: { fontSize: 22, fontWeight: 'bold', color: '#111', marginTop: 10 },
  groupStatus: { fontSize: 14, color: '#666', marginTop: 6, marginBottom: 16 },
  inviteBox: { width: '100%', backgroundColor: '#f7faff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e8eef8' },
  sectionLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.8 },
  inviteCode: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  copyBtnText: { color: Theme.colors.primary, fontWeight: '600', marginLeft: 6 },
  sectionCard: { width: '100%', backgroundColor: '#fcfdff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#edf2f7' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  memberRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eef2f7' },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111' },
  memberMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  removeBtn: { backgroundColor: '#ef4444', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  lockButton: { backgroundColor: '#111827', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 },
  leaveButton: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 }
});
