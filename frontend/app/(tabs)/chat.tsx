import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Users, MessageSquare } from 'lucide-react-native';
import { apiRequest } from '../../src/api';
import { Theme } from '../../src/theme';

const ChatList = () => {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const initials = getInitials(item.name);
    return (
      <TouchableOpacity 
        style={styles.chatItem} 
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name, isGroup: item.isGroup ? 'true' : 'false' } })}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, item.isGroup ? styles.groupAvatar : styles.userAvatar]}>
            {item.isGroup ? (
              <Users size={22} color="#fff" />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          {!item.isGroup && <View style={styles.activeDot} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.time}>{item.time || '10:00 AM'}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>

      {/* Messenger Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search color="#8E8E93" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color="#C7C7CC" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubtext}>Matches and group members outside your group will show up here to chat.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 5 },
  title: { fontSize: 30, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  searchSection: { paddingHorizontal: 16, marginVertical: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, height: 40, paddingHorizontal: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#000' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  chatItem: { flexDirection: 'row', paddingVertical: 12, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  userAvatar: { backgroundColor: '#E5E5EA' },
  groupAvatar: { backgroundColor: Theme.colors.primary },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#3A3A3C' },
  activeDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#34C759', borderWidth: 2, borderColor: '#fff' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#000', flex: 1, marginRight: 10 },
  time: { fontSize: 13, color: '#8E8E93' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#8E8E93', flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.primary, marginLeft: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 }
});

export default ChatList;
