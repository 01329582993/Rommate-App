import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { apiRequest, getStoredUser } from '../../src/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, Video } from 'lucide-react-native';
import { Theme } from '../../src/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Message {
  id?: string;
  content: string;
  senderId: string;
  sender?: { id: string; name: string };
  createdAt?: string;
}

export default function ChatRoom() {
  const { id, name, isGroup } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList | null>(null);

  useEffect(() => {
    let active = true;

    const setup = async () => {
      const user = await getStoredUser();
      if (!active) return;
      setCurrentUser(user);

      // Fetch message history
      const endpoint = isGroup === 'true' ? `/api/messages/group/${id}` : `/api/messages/direct/${id}`;
      try {
        const { response, data } = await apiRequest(endpoint);
        if (response.ok && Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }

      // Initialize Socket
      const roomId = isGroup === 'true' ? `group_${id}` : `direct_${id}`;
      socketRef.current = io(API_URL);
      socketRef.current.emit('join_room', roomId);

      socketRef.current.on('receive_message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });
    };

    setup();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id, isGroup]);

  const sendMessage = () => {
    if (!inputText.trim() || !currentUser || !socketRef.current) return;

    const roomId = isGroup === 'true' ? `group_${id}` : `direct_${id}`;
    const messageData = {
      roomId,
      senderId: currentUser.id,
      content: inputText.trim()
    };

    // Optimistic update for current user
    const optimisticMsg = { ...messageData, id: Date.now().toString(), sender: { id: currentUser.id, name: currentUser.name } };
    setMessages(prev => [...prev, optimisticMsg]);
    
    socketRef.current.emit('send_message', messageData);
    setInputText('');
  };

  const getInitials = (str: string) => {
    return (str || 'S')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === currentUser?.id;
    const initials = getInitials(item.sender?.name || '');
    
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMe && (
          <View style={styles.bubbleAvatar}>
            <Text style={styles.bubbleAvatarText}>{initials}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {!isMe && isGroup === 'true' && item.sender?.name && (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          )}
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Messenger Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#0084FF" />
          </TouchableOpacity>
          <View style={styles.headerUser}>
            <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
            <Text style={styles.headerSubtitle}>{isGroup === 'true' ? 'Group Chat' : 'Active now'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Voice Call', 'Starting voice call session...')}>
            <Phone size={22} color="#0084FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Video Call', 'Starting video call session...')}>
            <Video size={22} color="#0084FF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0084FF" />
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
        />
      )}

      {/* Messenger Message Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputContainer}>
          <View style={styles.inputPill}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Aa"
              placeholderTextColor="#999"
              multiline
            />
          </View>
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Send size={20} color="#0084FF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { marginRight: 12 },
  headerUser: { justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 20 },
  iconButton: { padding: 4 },
  listContainer: { paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1 },
  
  // Message style
  messageRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end', maxWidth: '85%' },
  myMessageRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  theirMessageRow: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2 },
  bubbleAvatarText: { fontSize: 10, fontWeight: 'bold', color: '#3A3A3C' },
  
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#0084FF',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  myMessageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  theirMessageText: { color: '#000', fontSize: 15, lineHeight: 20 },
  messageText: { fontSize: 15 },
  senderName: { fontSize: 11, color: '#8E8E93', marginBottom: 2, fontWeight: '600' },
  
  // Input area
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    alignItems: 'center'
  },
  inputPill: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100
  },
  input: {
    fontSize: 15,
    color: '#000',
    padding: 0
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
