import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const ChatList = () => {
  const router = useRouter();
  const [chats] = useState([
    { id: '1', name: 'Alex Johnson', lastMessage: 'Hey, are you still looking?', time: '10:30 AM', unread: 2 },
    { id: '2', name: 'Jordan Smith', lastMessage: 'The room looks great!', time: 'Yesterday', unread: 0 },
    { id: '3', name: 'Study Group', lastMessage: 'Let\'s meet at 5.', time: 'Yesterday', unread: 0, isGroup: true },
  ]);

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.chatItem} 
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name } })}
    >
      <View style={[styles.avatar, item.isGroup && styles.groupAvatar]} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20, color: '#1a1a1a' },
  list: { paddingHorizontal: 10 },
  chatItem: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#e1e1e1', marginRight: 15 },
  groupAvatar: { backgroundColor: '#007AFF' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  time: { fontSize: 12, color: '#999' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#666', flex: 1 },
  unreadBadge: { backgroundColor: '#007AFF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});

export default ChatList;
