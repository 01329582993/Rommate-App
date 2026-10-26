import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { apiRequest, getStoredUser, getStoredToken, API_URL } from '../../src/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, User as UserIcon, Users, CheckCheck, Shield } from 'lucide-react-native';

interface Message {
  id?: string;
  content: string;
  senderId: string;
  sender?: { id: string; name: string; role?: string };
  createdAt?: string;
}

export default function ChatRoom() {
  const { id, name, isGroup } = useLocalSearchParams<{
    id: string;
    name: string;
    isGroup: string;
  }>();
  const router = useRouter();
  const group = isGroup === 'true';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList | null>(null);

  useEffect(() => {
    let active = true;

    const setup = async () => {
      const [user, token] = await Promise.all([getStoredUser(), getStoredToken()]);
      if (!active) return;
      setCurrentUser(user);

      try {
        const { response, data } = await apiRequest(
          group ? `/api/messages/group/${id}` : `/api/messages/direct/${id}`
        );
        if (!active) return;
        if (response.ok && Array.isArray(data)) setMessages(data);
        else setLoadError(data?.message || 'Could not load messages.');
      } catch (err: any) {
        if (active) setLoadError(err?.message || 'Could not load messages.');
      } finally {
        if (active) setLoading(false);
      }

      const socket = io(API_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join_room', { isGroup: group, id });
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', () => setConnected(false));

      socket.on('receive_message', (msg: Message) => {
        setMessages((prev) =>
          msg.id && prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      });
    };

    setup();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [id, group]);

  const sendMessage = () => {
    const content = inputText.trim();
    if (!content || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { isGroup: group, id, content });
    setInputText('');
  };

  const getInitials = (str: string) =>
    (str || 'S')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser?.id;
    const isOfficialNotice =
      item.sender?.role === 'ADMIN' ||
      item.sender?.name?.includes('Admin') ||
      item.content.startsWith('🏛️') ||
      item.content.startsWith('⚠️');

    if (isOfficialNotice) {
      return (
        <View style={styles.adminNoticeRow}>
          <View style={styles.adminNoticeBubble}>
            <View style={styles.adminNoticeHeader}>
              <View style={styles.adminNoticeBadge}>
                <Shield size={12} color="#4338CA" />
                <Text style={styles.adminNoticeBadgeText}>OFFICIAL HOUSING NOTICE</Text>
              </View>
              {item.sender?.name && (
                <Text style={styles.adminNoticeAuthor}>{item.sender.name}</Text>
              )}
            </View>
            <Text style={styles.adminNoticeContent}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMe && (
          <View style={styles.bubbleAvatar}>
            <Text style={styles.bubbleAvatarText}>
              {getInitials(item.sender?.name || String(name || ''))}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {!isMe && group && item.sender?.name && (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          )}
          <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>{item.content}</Text>
          {isMe && (
            <View style={styles.receiptRow}>
              <CheckCheck size={12} color="rgba(255, 255, 255, 0.7)" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* MODERN CHAT HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.headerAvatar}>
              {group ? (
                <Users size={18} color="#FFFFFF" />
              ) : (
                <Text style={styles.headerAvatarText}>{getInitials(String(name || ''))}</Text>
              )}
            </View>

            <View style={styles.headerUser}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {name}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    connected ? styles.statusDotOnline : styles.statusDotOffline,
                  ]}
                />
                <Text style={styles.headerSubtitle}>
                  {connected ? (group ? 'Squad Sync • Active' : 'Live Sync • Online') : 'Connecting...'}
                </Text>
              </View>
            </View>
          </View>

          {!group && (
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(id) } })}
              activeOpacity={0.7}
              accessibilityLabel="View profile and reviews"
            >
              <UserIcon size={18} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* MESSAGES LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Syncing message stream...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Send size={28} color="#007AFF" />
                </View>
                <Text style={styles.emptyTitle}>Direct Connection Established</Text>
                <Text style={styles.emptySubtitle}>
                  {loadError || 'Say hello and start coordinating housing preferences!'}
                </Text>
              </View>
            }
          />
        )}

        {/* MODERN INPUT BAR */}
        <View style={styles.inputContainer}>
          <View style={styles.inputPill}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={2000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || !connected) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !connected}
            activeOpacity={0.8}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  headerUser: {
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  statusIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusDotOffline: {
    backgroundColor: '#F59E0B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubbleAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  theirMessageText: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  senderName: {
    fontSize: 11,
    color: '#6366F1',
    marginBottom: 3,
    fontWeight: '700',
  },
  receiptRow: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  inputPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    fontSize: 15,
    color: '#0F172A',
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  adminNoticeRow: {
    marginVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  adminNoticeBubble: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  adminNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adminNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminNoticeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  adminNoticeAuthor: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '600',
  },
  adminNoticeContent: {
    fontSize: 13,
    color: '#1E1B4B',
    lineHeight: 19,
    fontWeight: '500',
  },
});
