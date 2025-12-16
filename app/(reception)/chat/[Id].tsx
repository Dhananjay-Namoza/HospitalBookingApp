import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useUser } from '../../../context/UserContext';
import ApiService from '../../../services/api.service';
import ChatHeader from '../../../components/Chat/ChatHeader';
import ChatInput from '../../../components/Chat/ChatInput';
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

export default function ReceptionChatScreen() {
  const { id, userType = 'patient' } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherUserInfo, setOtherUserInfo] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

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

          unsubscribeNewMessage = onNewMessage((message) => {
            if (message.chatId === id) {
              setMessages((prev) => {
                if (prev.some(m => m._id === message._id || m.id === message.id)) {
                  return prev;
                }
                return [...prev, { ...message, status: 'delivered' }];
              });
              
              markMessagesRead(id as string);
              
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          });

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

              if (!prev.some(m => m._id === persistedMessage._id)) {
                return [...prev, { ...persistedMessage, status: 'sent' }];
              }

              return prev;
            });
          });

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
          });

        } catch (error) {
          console.error('Socket initialization error:', error);
        }
      };

      initializeSocket();
      loadChatData();

      return () => {
        unsubscribeNewMessage?.();
        unsubscribeSentSuccess?.();
        unsubscribeSentError?.();
      };
    }, [id])
  );

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      const messagesResponse = await ApiService.getChatMessages(parseInt(id as string));
      
      if (messagesResponse.success && messagesResponse.messages) {
        setMessages(messagesResponse.messages.map((m: any) => ({
          ...m,
          status: m.status || 'delivered',
        })));
        
        // Get other user info from first message if available
        const firstMessage = messagesResponse.messages[0];
        if (firstMessage) {
          setOtherUserInfo({
            name: userType === 'patient' ? 'Patient' : 'Doctor',
            isOnline: false,
          });
        }
        
        markMessagesRead(id as string);
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    typingStop(id as string);

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId: id as string,
      senderId: user?.id || 0,
      senderType: 'reception',
      messageType: 'text',
      body: messageText,
      status: 'sending',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

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
    }
  };

  const handleSendFile = async (file: any, type: 'image' | 'file') => {
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId: id as string,
      senderId: user?.id || 0,
      senderType: 'reception',
      messageType: type,
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

  const handleTyping = (isTyping: boolean) => {
    if (isSocketConnected()) {
      if (isTyping) {
        typingStart(id as string);
      } else {
        typingStop(id as string);
      }
    }
  };

  const handleRetry = async (message: Message) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === message._id ? { ...m, status: 'sending' } : m
      )
    );

    try {
      if (message.hasFile) {
        Alert.alert('Retry Failed', 'File no longer available. Please send again.');
        setMessages((prev) =>
          prev.map((m) =>
            m._id === message._id ? { ...m, status: 'failed' } : m
          )
        );
      } else {
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
      <ChatHeader
        name={otherUserInfo?.name || 'User'}
        isOnline={otherUserInfo?.isOnline}
        userType={userType as any}
        onInfoPress={() => Alert.alert('User Info', 'View user details')}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id || item.id?.toString() || ''}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
      />
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
});