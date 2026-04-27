import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

const socket = io(process.env.EXPO_PUBLIC_API_URL as string); // Use your local IP for physical devices

const ChatScreen = () => {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey! I saw your profile and we have a 95% match!', sender: 'other', time: '10:00 AM' },
    { id: '2', text: 'That sounds great! I was looking for someone clean and quiet.', sender: 'me', time: '10:05 AM' },
  ]);

  useEffect(() => {
    socket.emit('join_room', id);

    socket.on('receive_message', (data) => {
      if (data.senderId !== 'me') { // Simple logic for demo
        setMessages((prev) => [...prev, { id: Date.now().toString(), text: data.content, sender: 'other', time: 'Just now' }]);
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [id]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = { roomId: id, senderId: 'me', content: message };
      socket.emit('send_message', newMessage);
      setMessages([...messages, { id: Date.now().toString(), text: message, sender: 'me', time: 'Just now' }]);
      setMessage('');
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.messageBubble, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
      <Text style={[styles.messageText, item.sender === 'me' ? styles.myMessageText : styles.otherMessageText]}>
        {item.text}
      </Text>
      <Text style={styles.messageTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        inverted={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWh: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  messageList: { padding: 15 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 5 },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0', borderBottomLeftRadius: 5 },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#fff' },
  otherMessageText: { color: '#333' },
  messageTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 15, alignItems: 'center', borderTopWh: 1, borderTopColor: '#f0f0f0' },
  input: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100 },
  sendButton: { backgroundColor: '#007AFF', width: 45, height: 45, borderRadius: 22.5, alignItems: 'center', justifyContent: 'center' }
});

export default ChatScreen;


