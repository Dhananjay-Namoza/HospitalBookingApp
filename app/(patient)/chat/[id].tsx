import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '../../../context/UserContext';
import ApiService from '../../../services/api.service';
import MessageBubble from '../../../components/Chat/MessageBubble';
import { 
  connectSocket, 
  isSocketConnected 
} from '../../../socket/client';
import {
  sendMessage as socketSendMessage,
  onNewMessage,
  onMessageSentSuccess,
  onMessageSentError,
  typingStart,
  typingStop,
  markMessagesRead,
  bindSocketLifecycle,
  flushOutbox,
} from '../../../socket/events';
import { uploadFile } from '../../../api/files';

interface Message {
  _id?: string;
  id?: number;
  chatId: string;
  senderId: number | string;
  senderType: 'patient' | 'doctor' | 'reception';
  messageType: 'text' | 'image' | 'file';
  body?: string;
  hasFile?: boolean;
  file?: any;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
}

export default function PatientChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useFocusEffect(
    useCallback(() => {
      let unsubscribeNewMessage: (() => void) | undefined;
      let unsubscribeSentSuccess: (() => void) | undefined;
      let unsubscribeSentError: (() => void) | undefined;

      const initializeSocket = async () => {
        try {
          await connectSocket();
          bindSocketLifecycle();
          await flushOutbox();

          // Listen for new messages
          unsubscribeNewMessage = onNewMessage((message) => {
            if (message.chatId === id) {
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m._id === message._id || m.id === message.id)) {
                  return prev;
                }
                return [...prev, { ...message, status: 'delivered' }];
              });
              
              // Mark as read
              markMessagesRead(id as string);
              
              // Scroll to bottom
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          });

          // Listen for message sent confirmation
          unsubscribeSentSuccess = onMessageSentSuccess((data) => {
            const persistedMessage = data?.message;
            if (!persistedMessage) return;

            setMessages((prev) => {
              const index = prev.findIndex(
                m => m.status === 'sending' && 
                     m.chatId === persistedMessage.chatId &&
                     m.messageType === persistedMessage.messageType &&
                     (m.body || '') === (persistedMessage.body || '')
              );

              if (index >= 0) {
                const updated = [...prev];
                updated[index] = { ...persistedMessage, status: 'sent' };
                return updated;
              }

              // Add if not found (shouldn't happen normally)
              if (!prev.some(m => m._id === persistedMessage._id)) {
                return [...prev, { ...persistedMessage, status: 'sent' }];
              }

              return prev;
            });
          });

          // Listen for message send errors
          unsubscribeSentError = onMessageSentError(() => {
            setMessages((prev) => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].status === 'sending') {
                  updated[i] = { ...updated[i], status: 'failed' };
                  break;
                }
              }
              return updated;
            });
            setSending(false);
          });

        } catch (error) {
          console.error('Socket initialization error:', error);
        }
      };

      initializeSocket();
      loadMessages();

      return () => {
        // Cleanup listeners
        unsubscribeNewMessage?.();
        unsubscribeSentSuccess?.();
        unsubscribeSentError?.();
        
        // Clear typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, [id])
  );

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getChatMessages(parseInt(id as string));
      
      if (response.success && response.messages) {
        setMessages(response.messages.map((m: any) => ({
          ...m,
          status: m.status || 'delivered',
        })));
        
        // Mark as read
        markMessagesRead(id as string);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    typingStop(id as string);

    // Create optimistic message
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId: id as string,
      senderId: user?.id || 0,
      senderType: 'patient',
      messageType: 'text',
      body: messageText,
      status: 'sending',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      if (isSocketConnected()) {
        await socketSendMessage({
          chatId: id as string,
          messageType: 'text',
          body: messageText,
        });
      } else {
        // Fallback to REST API
        const response = await ApiService.sendMessage(
          parseInt(id as string),
          messageText
        );
        
        if (response.success && response.message) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === optimisticMessage._id
                ? { ...response.message, status: 'sent' }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMessage._id
            ? { ...m, status: 'failed' }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    // Send typing indicator
    if (text.trim() && isSocketConnected()) {
      typingStart(id as string);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        typingStop(id as string);
      }, 3000);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFileUpload(result.assets[0], 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFileUpload(result.assets[0], 'file');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleFileUpload = async (file: any, messageType: 'image' | 'file') => {
    // Create optimistic message
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId: id as string,
      senderId: user?.id || 0,
      senderType: 'patient',
      messageType,
      hasFile: true,
      body: file.name || 'File',
      status: 'sending',
      timestamp: new Date().toISOString(),
      file: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const uploadedMessage = await uploadFile(id as string, file, '');

      if (uploadedMessage) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === optimisticMessage._id
              ? { ...uploadedMessage, status: 'sent' }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMessage._id
            ? { ...m, status: 'failed' }
            : m
        )
      );
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const handleRetry = async (message: Message) => {
    // Update status to sending
    setMessages((prev) =>
      prev.map((m) =>
        m._id === message._id ? { ...m, status: 'sending' } : m
      )
    );

    try {
      if (message.hasFile) {
        // Retry file upload would require storing original file
        Alert.alert('Retry Failed', 'File no longer available. Please send again.');
        setMessages((prev) =>
          prev.map((m) =>
            m._id === message._id ? { ...m, status: 'failed' } : m
          )
        );
      } else {
        // Retry text message
        await socketSendMessage({
          chatId: message.chatId,
          messageType: 'text',
          body: message.body || '',
        });
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id ? { ...m, status: 'failed' } : m
        )
      );
      Alert.alert('Error', 'Failed to retry message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === user?.id}
      onRetry={handleRetry}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id || item.id?.toString() || ''}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => {
            Alert.alert('Send File', 'Choose file type', [
              { text: 'Image', onPress: handleImagePick },
              { text: 'Document', onPress: handleDocumentPick },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        >
          <Ionicons name="add-circle-outline" size={28} color="#2196F3" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  attachButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});