import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ChatHeaderProps {
  name: string;
  isOnline?: boolean;
  userType?: 'patient' | 'doctor' | 'reception';
  onInfoPress?: () => void;
}

export default function ChatHeader({ 
  name, 
  isOnline = false, 
  userType = 'patient',
  onInfoPress 
}: ChatHeaderProps) {
  const router = useRouter();

  const getUserIcon = () => {
    switch (userType) {
      case 'doctor':
        return 'medical';
      case 'reception':
        return 'business';
      default:
        return 'person';
    }
  };

  const getUserBadgeColor = () => {
    switch (userType) {
      case 'doctor':
        return '#2196F3';
      case 'reception':
        return '#FF9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getUserBadgeColor() }]}>
            <Ionicons name={getUserIcon()} size={24} color="#fff" />
          </View>
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.status}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {onInfoPress && (
        <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  status: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
});