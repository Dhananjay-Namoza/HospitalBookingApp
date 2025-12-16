import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useUser } from '../../../context/UserContext';
import ApiService from '../../../services/api.service';
import MessageBubble from '../../../components/Chat/MessageBubble';
import ChatHeader from '../../../components/Chat/ChatHeader';
import ChatInput from '../../../components/Chat/ChatInput';
import { uploadFile } from '../../../api/files';
import {
  connectSocket,
  isSocketConnected,
} from '../../../socket/client';
import {
  sendMessage as socketSendMessage,
  onNewMessage,
  onMessageSentSuccess,
  onMessageSentError,
  markMessagesRead,
  bindSocketLifecycle,
  flushOutbox,
} from '../../../socket/events';

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

export default function ReceptionChatDetailScreen() {
  const { id, otherUserId, otherUserName, userType } = useLocalSearchParams();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Initialize socket and load messages
  useFocusEffect(
    useCallback(() => {
      let unsubscribeNewMessage: (() => void) | undefined;
      let unsubscribeSentSuccess: (() => void) | undefined;
      let unsubscribeSentError: (() => void) | undefined;

      const initializeChat = async () => {
        try {
          await connectSocket();
          bindSocketLifecycle();
          await flushOutbox();

          // Listen for new messages
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

          // Listen for sent message confirmation
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

          // Listen for message errors
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

      initializeChat();
      loadMessages();

      return () => {
        unsubscribeNewMessage?.();
        unsubscribeSentSuccess?.();
        unsubscribeSentError?.();
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
        
        markMessagesRead(id as string);
        
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

  const handleSendMessage = async (messageText: string) => {
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
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMessage._id
            ? { ...m, status: 'failed' }
            : m
        )
      );
    }
  };

  const handleSendImage = async (image: any) => {
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId: id as string,
      senderId: user?.id || 0,
      senderType: 'reception',
      messageType: 'image',
      hasFile: true,
      body: 'Image',
      status: 'sending',
      timestamp: new Date().toISOString(),
      file: {
        fileName: image.fileName || 'image.jpg',
        fileSize: image.fileSize,
        mimeType: image.mimeType,
      },
      _originalFile: {
        uri: image.uri,
        fileName: image.fileName || 'image.jpg',
        fileSize: image.fileSize,
        mimeType: image.mimeType,
      }
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const uploadedMessage = await uploadFile(id as string, image, '');

      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMessage._id
            ? { ...uploadedMessage, status: 'sent' }
            : m
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMessage._id
            ? { ...m, status: 'failed' }
            : m
        )
      );
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleSendFile = async (file: any) => {
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId: id as string,
      senderId: user?.id || 0,
      senderType: 'reception',
      messageType: 'file',
      hasFile: true,
      body: file.name,
      status: 'sending',
      timestamp: new Date().toISOString(),
      file: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
      },
      _originalFile: {
        uri: file.uri,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
      }
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const uploadedMessage = await uploadFile(id as string, file, file.name);

      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimisticMessage._id
            ? { ...uploadedMessage, status: 'sent' }
            : m
        )
      );
    } catch (error) {
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
    if (!message || message.status !== 'failed') return;
    
    setMessages(prev => prev.map(m => m._id === message._id ? { ...m, status: 'sending' } : m));

    try {
      if (["image", "file"].includes(message.messageType) && message.hasFile) {
        if (message._originalFile?.uri) {
          const uploadedMessage = await uploadFile(id as string, {
            uri: message._originalFile.uri,
            fileName: message._originalFile.fileName,
            fileSize: message._originalFile.fileSize,
            mimeType: message._originalFile.mimeType,
          }, message.body || '');

          setMessages((prev) =>
            prev.map((m) =>
              m._id === message._id
                ? { ...uploadedMessage, status: 'sent', _originalFile: message._originalFile }
                : m
            )
          );
        } else {
          Alert.alert('Retry Failed', 'Original file no longer available');
          setMessages(prev => prev.map(m => m._id === message._id ? { ...m, status: 'failed' } : m));
        }
      } else {
        await socketSendMessage({
          chatId: message.chatId,
          messageType: message.messageType,
          body: message.body || '',
        });
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m._id === message._id ? { ...m, status: 'failed' } : m));
      Alert.alert('Retry Failed', String(e?.message || e));
    }
  };

  const handleInfoPress = () => {
    Alert.alert(
      'User Info',
      `Name: ${otherUserName}\nType: ${userType}\nUser ID: ${otherUserId}`
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={{
        ...item,
        onRetry: handleRetry
      }}
      isOwn={item.senderId === user?.id}
      onPressImage={(msg) => console.log('Image pressed:', msg)}
      onPressFile={(msg) => console.log('File pressed:', msg)}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        title={otherUserName as string || 'User'}
        subtitle={`${userType === 'doctor' ? 'Doctor' : 'Patient'}`}
        onInfoPress={handleInfoPress}
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
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        placeholder="Type a message to staff..."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesList: {
    paddingVertical: 10,
  },
});