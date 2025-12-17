import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
import ApiService from '../../../services/api.service';
export default function ChatsScreen() {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchText, setSearchText] = useState('');
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  useEffect(() => {
  loadChats();
}, []);
const loadChats = async () => {
  try {
    setLoading(true);
    const response = await ApiService.getChats();
    
    if (response.success && response.chats) {
      setChats(response.chats);
      setFilteredChats(response.chats);
    }
  } catch (err) {
    console.error('Error loading chats:', err);
  } finally {
    setLoading(false);
  }
};

  const formatTimestamp = (timestamp: string) => {
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

  const handleChatPress = async (chat) => {
  if (chat.type === 'doctor') {
    Alert.alert(
      'Premium Feature',
      'Chat with doctors is available for premium members only.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Create chat if it doesn't exist
  try {
 
    if (chat.chatId) {
      router.push({
        pathname: '/(patient)/chat/[id]',
        params: { id: chat.chatId, chat: JSON.stringify(chat), type: chat.type}
      });
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to open chat');
  }
};

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Ionicons 
              name={item.type === 'doctor' ? 'medical' : 'business'} 
              size={24} 
              color="#fff" 
            />
          </View>
        )}
        {item.type === 'doctor' && !user?.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.otherUser.name}</Text>
          <View style={styles.timeAndBadge}>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessage?.timestamp)}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text 
            style={[
              styles.lastMessage,
              item.type === 'doctor' && !user?.isPremium && styles.lockedMessage
            ]} 
            numberOfLines={2}
          >
              {item.lastMessage?.content ?? "No messages yet"}
          </Text>
          {item.type === 'doctor' && (
            <View style={styles.doctorBadge}>
              <Ionicons name="medical" size={12} color="#2196F3" />
              <Text style={styles.doctorBadgeText}>Doctor</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with hospital reception or book an appointment to chat with doctors
      </Text>
      <TouchableOpacity 
        style={styles.startChatButton}
        onPress={() => Alert.alert('Contact', 'Contact reception feature will be available soon!')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.startChatText}>Contact Reception</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {user?.isPremium  &&(
        <View style={styles.premiumHeader}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.premiumText}>Premium Member - Chat with doctors enabled</Text>
        </View>
      )}

      <FlatList
        data={chats}
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
          chats.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  premiumText: {
    fontSize: 14,
    color: '#F57F17',
    marginLeft: 8,
    fontWeight: '500',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  upgradeText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  chatItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timeAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  lockedMessage: {
    fontStyle: 'italic',
    color: '#999',
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  doctorBadgeText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startChatText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
