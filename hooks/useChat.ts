import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/api.service';
import { uploadFile } from '../api/files';
import {
  connectSocket,
  isSocketConnected,
} from '../socket/client';
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
} from '../socket/events';

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
  _originalFile?: any;
}

interface UseChatOptions {
  chatId: string;
  currentUserId: number;
  currentUserType: 'patient' | 'doctor' | 'reception';
  onMessageReceived?: (message: Message) => void;
}

export function useChat({
  chatId,
  currentUserId,
  currentUserType,
  onMessageReceived,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const flatListRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Initialize socket and load messages
  useEffect(() => {
    initializeChat();
    
    return () => {
      cleanup();
    };
  }, [chatId]);

  const initializeChat = async () => {
    try {
      // Connect socket
      await connectSocket();
      bindSocketLifecycle();
      await flushOutbox();

      // Set up event listeners
      setupSocketListeners();

      // Load messages
      await loadMessages();
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const setupSocketListeners = () => {
    // Listen for new messages
    const unsubNewMessage = onNewMessage((message) => {
      if (message.chatId === chatId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id || m.id === message.id)) {
            return prev;
          }
          return [...prev, { ...message, status: 'delivered' }];
        });
        
        markMessagesRead(chatId);
        
        if (onMessageReceived) {
          onMessageReceived(message);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Listen for sent message confirmation
    const unsubSentSuccess = onMessageSentSuccess((data) => {
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
      
      setSending(false);
    });

    // Listen for errors
    const unsubSentError = onMessageSentError(() => {
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
      Alert.alert('Error', 'Failed to send message');
    });

    // Store unsubscribers
    unsubscribersRef.current = [
      unsubNewMessage,
      unsubSentSuccess,
      unsubSentError,
    ];
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getChatMessages(chatId);
      
      if (response.success && response.messages) {
        setMessages(response.messages.map((m: any) => ({
          ...m,
          status: m.status || 'delivered',
        })));
        
        markMessagesRead(chatId);
        
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

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || sending) return;

    stopTyping();
    setSending(true);

    const optimisticMessage: Message = {
      chatId,
      senderId: currentUserId,
      senderType: currentUserType,
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
          chatId,
          messageType: 'text',
          body: messageText,
        });
      } else {
        const response = await ApiService.sendMessage(
          parseInt(chatId),
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
        setSending(false);
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
      setSending(false);
    }
  }, [chatId, currentUserId, currentUserType, sending]);

  const handleSendFile = useCallback(async (file: any, type: 'image' | 'file') => {
    if (sending) return;

    setSending(true);
    console.log('Uploading file:', file);
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      chatId,
      senderId: currentUserId,
      senderType: currentUserType,
      messageType: type,
      hasFile: true,
      body: file.name || file.fileName,
      status: 'sending',
      timestamp: new Date().toISOString(),
      file: {
        fileName: file.name || file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      },
      _originalFile: file,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const uploadedMessage = await uploadFile(chatId, file, '');

      if (uploadedMessage) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === optimisticMessage._id
              ? { ...uploadedMessage, status: 'sent', _originalFile: file }
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
    } finally {
      setSending(false);
    }
  }, [chatId, currentUserId, currentUserType, sending]);

  const handleRetry = useCallback(async (message: Message) => {
    if (!message || message.status !== 'failed') return;
    
    setMessages(prev => prev.map(m => 
      m._id === message._id ? { ...m, status: 'sending' } : m
    ));

    try {
      if (message.hasFile && message._originalFile) {
        await handleSendFile(message._originalFile, message.messageType as 'image' | 'file');
      } else {
        await socketSendMessage({
          chatId: message.chatId,
          messageType: 'text',
          body: message.body || '',
        });
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m._id === message._id ? { ...m, status: 'failed' } : m
      ));
      Alert.alert('Error', 'Failed to retry message');
    }
  }, [handleSendFile]);

  const startTyping = useCallback(() => {
    if (!isTyping && isSocketConnected()) {
      setIsTyping(true);
      typingStart(chatId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [chatId, isTyping]);

  const stopTyping = useCallback(() => {
    if (isTyping && isSocketConnected()) {
      setIsTyping(false);
      typingStop(chatId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [chatId, isTyping]);

  const cleanup = () => {
    // Unsubscribe from all socket events
    unsubscribersRef.current.forEach(unsub => unsub?.());
    unsubscribersRef.current = [];

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    stopTyping();
  };

  return {
    messages,
    loading,
    sending,
    isTyping,
    otherUserTyping,
    flatListRef,
    handleSendMessage,
    handleSendFile,
    handleRetry,
    startTyping,
    stopTyping,
    loadMessages,
  };
}