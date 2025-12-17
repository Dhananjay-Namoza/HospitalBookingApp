import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../services/api.service';
import { connectSocket, isSocketConnected } from '../socket/client';
import { onNewMessage, bindSocketLifecycle } from '../socket/events';
import { sortChatsByTime } from '../utils/chatUtils';

interface Chat {
  id: string;
  chatId: string;
  otherUser: {
    _id: number;
    id: number;
    name: string;
    type: 'patient' | 'doctor' | 'reception';
    isOnline?: boolean;
  };
  lastMessage: {
    body: string;
    messageType: string;
    timestamp: string;
  };
  lastMessageAt: string;
  hasUnreadMessages: boolean;
  unreadCount?: number;
}

interface UseChatListOptions {
  userType: 'patient' | 'doctor' | 'reception';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useChatList({
  userType,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseChatListOptions) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load chats on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      initializeChatList();

      // Set up auto-refresh
      let intervalId: NodeJS.Timeout | null = null;
      if (autoRefresh) {
        intervalId = setInterval(loadChats, refreshInterval);
      }

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [autoRefresh, refreshInterval])
  );

  // Filter chats when search text changes
  useEffect(() => {
    filterChats();
  }, [searchText, chats]);

  const initializeChatList = async () => {
    try {
      // Connect socket
      await connectSocket();
      bindSocketLifecycle();

      // Listen for new messages
      onNewMessage((message) => {
        updateChatWithNewMessage(message);
      });

      // Load chats
      await loadChats();
    } catch (error) {
      console.error('Error initializing chat list:', error);
    }
  };

  const loadChats = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await ApiService.getChats();

      if (response.success && response.chats) {
        const sortedChats = sortChatsByTime(response.chats);
        setChats(sortedChats);
        setFilteredChats(sortedChats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
  };

  const filterChats = () => {
    if (!searchText.trim()) {
      setFilteredChats(chats);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = chats.filter((chat) =>
      chat.otherUser?.name?.toLowerCase().includes(searchLower)
    );
    setFilteredChats(filtered);
  };

  const updateChatWithNewMessage = (message: any) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(
        (chat) => chat.chatId === message.chatId
      );

      if (chatIndex >= 0) {
        const updated = [...prevChats];
        updated[chatIndex] = {
          ...updated[chatIndex],
          lastMessage: {
            body: message.body || '',
            messageType: message.messageType,
            timestamp: message.timestamp,
          },
          lastMessageAt: message.timestamp,
          hasUnreadMessages: true,
          unreadCount: (updated[chatIndex].unreadCount || 0) + 1,
        };

        // Move to top
        return sortChatsByTime(updated);
      }

      return prevChats;
    });
  };

  const markChatAsRead = async (chatId: string) => {
    try {
      await ApiService.markChatAsRead(parseInt(chatId));

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.chatId === chatId
            ? { ...chat, hasUnreadMessages: false, unreadCount: 0 }
            : chat
        )
      );
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const getUnreadCount = useCallback(() => {
    return chats.filter((chat) => chat.hasUnreadMessages).length;
  }, [chats]);

  const getTotalUnreadMessages = useCallback(() => {
    return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  }, [chats]);

  const getChatByUserType = useCallback(
    (type: 'patient' | 'doctor' | 'reception') => {
      return filteredChats.filter((chat) => chat.otherUser?.type === type);
    },
    [filteredChats]
  );

  const deleteChatLocally = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.chatId !== chatId));
  };

  return {
    chats: filteredChats,
    allChats: chats,
    loading,
    refreshing,
    searchText,
    setSearchText,
    loadChats,
    onRefresh,
    markChatAsRead,
    getUnreadCount,
    getTotalUnreadMessages,
    getChatByUserType,
    deleteChatLocally,
  };
}