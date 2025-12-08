import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
import { mockMessages, mockChats } from '../../../data/mockData';
import ApiService from '../../../services/api.service';
interface Message {
  id: number;
  senderId: number | string;
  senderType: 'patient' | 'doctor' | 'reception';
  message: string;
  timestamp: string;
}

export default function PatientChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState({
    name: 'tester',
    email: 'tester@example.com',
    phone: '1234567890',
    type: 'doctor',
  });
  const flatListRef = useRef<FlatList<any> | null>(null);

  useEffect(() => {
    loadChatData();
  }, []);
  const loadChatData = async () => {
  try {
    const chatId = parseInt(id as string);
    const response = await ApiService.getChatMessages(chatId);
    
    if (response.success && response.messages) {
      setMessages(response.messages);
    }
  } catch (err) {
    console.error('Error loading messages:', err);
  }
};
  const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const chatId = parseInt(id as string);
    const response = await ApiService.sendMessage(chatId, newMessage.trim());
    
    if (response.success && response.message) {
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to send message');
  }
};
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderType === 'patient' && item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {!isMyMessage && (
          <View style={styles.senderInfo}>
            <Ionicons 
              name={item.senderType === 'doctor' ? 'medical' : 'business'} 
              size={16} 
              color="#2196F3" 
            />
            <Text style={styles.senderName}>
              {item.senderType === 'doctor' ? chat?.name : 'Reception'}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <Ionicons 
        name={chat?.type === 'doctor' ? 'medical' : 'chatbubbles'} 
        size={50} 
        color="#ccc" 
      />
      <Text style={styles.emptyChatTitle}>Start Conversation</Text>
      <Text style={styles.emptyChatSubtitle}>
        {chat?.type === 'doctor' 
          ? 'Send a message to start chatting with your doctor'
          : 'Send a message to get help from our reception team'
        }
      </Text>
    </View>
  );

  if (!chat) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>Chat not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.chatInfo}>
          <Ionicons 
            name={chat.type === 'doctor' ? 'medical' : 'business'} 
            size={24} 
            color="#2196F3" 
          />
          <View style={styles.chatDetails}>
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.chatStatus}>
              {chat.type === 'doctor' ? 'Doctor' : 'Hospital Reception'}
            </Text>
          </View>
        </View>
        {chat.type === 'doctor' && user?.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
          </View>
        )}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyChat}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.emptyMessagesList
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={
              chat.type === 'doctor' 
                ? 'Type your message to doctor...' 
                : 'Type your message...'
            }
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? '#2196F3' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
        
        {chat.type === 'doctor' && (
          <Text style={styles.inputHelper}>
            💡 Be specific about your symptoms for better assistance
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginTop: 10,
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatDetails: {
    marginLeft: 15,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatStatus: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  premiumBadge: {
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexGrow: 1,
  },
  emptyMessagesList: {
    justifyContent: 'center',
  },
  emptyChatContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  senderName: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 5,
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  myMessageBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 5,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: '#E3F2FD',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 80,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 10,
    padding: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
