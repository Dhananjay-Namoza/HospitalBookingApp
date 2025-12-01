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
  Alert,
    ScrollView
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
import { mockMessages, mockUsers } from '../../../data/mockData';

interface Message {
  id: number;
  senderId: number | string;
  senderType: 'patient' | 'doctor' | 'reception';
  message: string;
  timestamp: string;
}

export default function DoctorChatScreen() {
  const { id, type } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patient, setPatient] = useState(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatData();
  }, []);

  const loadChatData = () => {
    const patientId = parseInt(id as string);
    const foundPatient = mockUsers.find(u => u.id === patientId && u.type === 'patient');
    
    // Find existing messages for this patient-doctor chat
    const existingMessages = Object.values(mockMessages).flat().filter(msg =>
      (msg.senderId === patientId || msg.senderId === user?.id) &&
      (msg.senderType === 'patient' || msg.senderType === 'doctor')
    );
    
    setPatient(foundPatient);
    setMessages(existingMessages);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now(),
      senderId: user?.id || 101,
      senderType: 'doctor',
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderType === 'doctor' && item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {!isMyMessage && (
          <View style={styles.senderInfo}>
            <Ionicons name="person" size={16} color="#2196F3" />
            <Text style={styles.senderName}>{patient?.name || 'Patient'}</Text>
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
      <Ionicons name="medical" size={50} color="#ccc" />
      <Text style={styles.emptyChatTitle}>Start Medical Consultation</Text>
      <Text style={styles.emptyChatSubtitle}>
        Send a message to start consultation with {patient?.name || 'this patient'}
      </Text>
    </View>
  );

  const renderQuickReplies = () => (
    <View style={styles.quickRepliesContainer}>
      <Text style={styles.quickRepliesTitle}>Quick Replies:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {quickReplies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReplyButton}
            onPress={() => setNewMessage(reply)}
          >
            <Text style={styles.quickReplyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const quickReplies = [
    "How are you feeling today?",
    "Please describe your symptoms",
    "Take medications as prescribed",
    "Schedule a follow-up appointment",
    "Avoid strenuous activities",
    "Drink plenty of water"
  ];

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>Patient not found</Text>
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
        <View style={styles.patientInfo}>
          <Ionicons name="person-circle" size={32} color="#2196F3" />
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientType}>Patient</Text>
              {patient.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert('Patient Info', `${patient.name}\nEmail: ${patient.email}\nPhone: ${patient.phone}`)}
        >
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
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

      {/* Quick Replies */}
      {renderQuickReplies()}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your medical advice..."
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
        
        <Text style={styles.inputHelper}>
          🏥 Provide clear medical guidance and recommendations
        </Text>
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
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientDetails: {
    marginLeft: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientType: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumText: {
    fontSize: 10,
    color: '#FF8F00',
    fontWeight: 'bold',
    marginLeft: 3,
  },
  infoButton: {
    padding: 5,
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
  quickRepliesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  quickReplyButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickReplyText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
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
