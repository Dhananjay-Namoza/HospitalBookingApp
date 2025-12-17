import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../../services/api.service';
import { useUser } from '../../../context/UserContext';

export default function PatientChatsScreen() {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    filterChats();
  }, [searchText, chats]);

 const loadChats = async () => {
  try {
    setLoading(true);
    const response = await ApiService.getChats();

    const list = Array.isArray(response.chats) ? response.chats : [];

    setChats(list);
    setFilteredChats(list);
  } catch (err) {
    console.error('Error loading chats:', err);
    setChats([]);
    setFilteredChats([]);
  } finally {
    setLoading(false);
  }
};

  const filterChats = () => {
  if (searchText === '') {
    setFilteredChats(chats);
  } else {
    const filtered = chats.filter(chat =>
      chat?.otherUser?.name?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredChats(filtered);
  }
};


  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      loadChats();
      setRefreshing(false);
    }, 1000);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleChatPress = (chat) => {
    router.push({
      pathname: '/(patient)/chat/[id]',
      params: { id: chat.chatId, chat: JSON.stringify(chat) }
    });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item?.otherUser?.avatar ? (
          <Image source={{ uri: item.otherUser.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
        )}

        {/* Premium Badge (same as doctor screen) */}
        {item?.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item?.otherUser?.name}</Text>

          <View style={styles.timeAndBadge}>
            <Text style={styles.timestamp}>
              {formatTimestamp(item?.lastMessageAt)}
            </Text>

            {item?.hasUnreadMessages && (
              <View style={styles.unreadBadge} />
            )}
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item?.lastMessage?.content || ''}
          </Text>

          {/* Doctor badge for patient view */}
          <View style={styles.doctorBadge}>
            <Ionicons name="medical" size={12} color="#2196F3" />
            <Text style={styles.doctorBadgeText}>Doctor</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with hospital staff or your doctor.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Header (same as doctor) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchText}
            onChangeText={setSearchText}
          />

          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{chats?.length}</Text>
          <Text style={styles.statLabel}>Total Chats</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {(chats || []).filter(c => c.hasUnreadMessages).length}
          </Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {(chats || []).filter(c => c.isPremium).length}
          </Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.chatId.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          filteredChats?.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  /* --- Search Bar --- */
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 2
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },

  /* --- Stats Header --- */
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginBottom: 10,
    elevation: 1
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#2196F3' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },

  /* --- Chat Row --- */
  chatItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  defaultAvatar: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center'
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  chatContent: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  chatName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeAndBadge: { flexDirection: 'row', alignItems: 'center' },

  timestamp: { fontSize: 12, color: '#666', marginRight: 8 },

  unreadBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    width: 10,
    height: 10
  },

  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  lastMessage: { fontSize: 14, color: '#666', flex: 1 },

  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10
  },
  doctorBadgeText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 3
  },

  /* --- Empty State --- */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20
  }
});
