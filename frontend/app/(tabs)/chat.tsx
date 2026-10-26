import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, Users, MessageSquare, Compass, ShieldCheck } from 'lucide-react-native';
import { apiRequest } from '../../src/api';
import { Theme } from '../../src/theme';

const ChatList = () => {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const { response, data } = await apiRequest('/api/messages/conversations');
      if (response.ok && Array.isArray(data)) {
        setChats(data);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const formatTime = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter((chat) =>
    (chat.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return (name || 'U')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const initials = getInitials(item.name);
    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: { id: item.id, name: item.name, isGroup: item.isGroup ? 'true' : 'false' },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, item.isGroup ? styles.groupAvatar : styles.userAvatar]}>
            {item.isGroup ? (
              <Users size={22} color="#FFFFFF" />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          {!item.isGroup && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isGroup && (
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>SQUAD</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>{formatTime(item.time)}</Text>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, item.unread > 0 && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {item.lastMessage || 'Say hello and start coordinating!'}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerBadge}>CONVERSATIONS</Text>
        <Text style={styles.title}>Messages</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search color="#94A3B8" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roommate chats..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* CHAT LIST OR EMPTY STATE */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingSub}>Loading conversations...</Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MessageSquare size={36} color="#007AFF" />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Your squad chats and matched roommates will appear here. Swipe on profiles in Discover to start connecting.
          </Text>
          <TouchableOpacity
            style={styles.discoverBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <Compass size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.discoverBtnText}>Explore Matches</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 42,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 100, // Space for floating bottom tab bar
    gap: 8,
  },
  chatCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  groupAvatar: {
    backgroundColor: '#6366F1',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#007AFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  lastMessageUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingSub: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  discoverBtn: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  discoverBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ChatList;
