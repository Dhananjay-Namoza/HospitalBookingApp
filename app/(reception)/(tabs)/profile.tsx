import React, {  useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
import { useFocusEffect } from 'expo-router';
import ApiService from '../../../services/api.service';
export default function ReceptionProfileScreen() {
      const [stats, setStats] = useState({
        pendingMessages: 0,
      });
  const { user, logout } = useUser();
   const [pendingMessages, setPendingMessages] = useState([]);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    useFocusEffect(
      React.useCallback(() => {
        loadPendingMessages();
      }, [])
    );
    const loadPendingMessages = async () => {
      try {
        const response = await ApiService.getReceptionMessages({ status: 'pending' });
        if (response.success && response.messages) {
          setPendingMessages(response.messages);
            setStats({
                pendingMessages: response.messages.length
            });
        }
        } catch (err) {
            console.error('Error loading pending messages:', err);
        }
    }
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
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
    const handleMessagePress = (message: any) => {
        setShowNotificationModal(false);
        router.push({
          pathname: '/(reception)/(tabs)/appointments'
        });
      };
    
      const handleMarkAllRead = async () => {
        try {
          for (const message of pendingMessages) {
            await ApiService.updateReceptionMessage(message.id, { status: 'handled' });
          }
          setShowNotificationModal(false);
          Alert.alert('Success', 'All notifications marked as read');
        } catch (err) {
          Alert.alert('Error', 'Failed to update messages');
        }
      };
    const renderNotification = ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => handleMessagePress(item)}
      >
        <View style={styles.notificationIcon}>
          <Ionicons name="alert-circle" size={24} color="#FF9800" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.doctorName} - Unavailability</Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatTimestamp(item.createdAt)}</Text>
        </View>
        <View style={styles.unreadDot} />
      </TouchableOpacity>
    );
  
    const renderEmptyNotifications = () => (
      <View style={styles.emptyNotifications}>
        <Ionicons name="notifications-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptySubtitle}>You're all caught up!</Text>
      </View>
    );
  const renderProfileSection = (title: string, items: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.settingRow}
          onPress={item.onPress}
        >
          <View style={styles.settingInfo}>
            <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="business" size={40} color="#fff" />
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || 'Reception Admin'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'reception@hospital.com'}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#2196F3" />
          <Text style={styles.roleText}>Reception Staff</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoCards}>
        <View style={styles.infoCard}>
          <Ionicons name="calendar" size={24} color="#2196F3" />
          <Text style={styles.infoCardNumber}>150+</Text>
          <Text style={styles.infoCardLabel}>Managed Today</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="people" size={24} color="#4CAF50" />
          <Text style={styles.infoCardNumber}>1.2K</Text>
          <Text style={styles.infoCardLabel}>Total Patients</Text>
        </View>
      </View>

      {/* Management */}
      {renderProfileSection('Management', [
        {
          icon: 'calendar-outline',
          title: 'Appointments',
          subtitle: 'View and manage all appointments',
          color: '#2196F3',
          onPress: () => router.push('/(reception)/(tabs)/appointments')
        },
        {
          icon: 'mail-outline',
          title: 'Doctor Messages',
          subtitle: 'Handle unavailability requests',
          color: '#FF9800',
          onPress: () => router.push('/(reception)/(tabs)/chats')
        },
        {
          icon: 'medical-outline',
          title: 'Doctors',
          subtitle: 'Manage doctor profiles',
          color: '#4CAF50',
          onPress: () => router.push('/(reception)/(tabs)/doctors')
        }
      ])}

      {/* Account Settings */}
      {renderProfileSection('Account Settings', [
        {
          icon: 'person-outline',
          title: 'Personal Information',
          subtitle: 'Update your profile details',
          color: '#9C27B0',
          onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available soon!')
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          color: '#FF5722',
          onPress: () => setShowNotificationModal(true)
        },
        {
          icon: 'lock-closed-outline',
          title: 'Change Password',
          subtitle: 'Update your password',
          color: '#607D8B',
          onPress: () => Alert.alert('Coming Soon', 'Password change will be available soon!')
        }
      ])}

      {/* Support */}
      {renderProfileSection('Support', [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          color: '#00BCD4',
          onPress: () => Alert.alert('Support', 'Contact: support@hospital.com')
        },
        {
          icon: 'shield-outline',
          title: 'Privacy Policy',
          subtitle: 'View our privacy policy',
          color: '#009688',
          onPress: () => Alert.alert('Privacy Policy', 'Privacy policy will be available soon!')
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          subtitle: 'View terms and conditions',
          color: '#795548',
          onPress: () => Alert.alert('Terms', 'Terms of service will be available soon!')
        }
      ])}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#f44336" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Reception Portal v1.0.0</Text>
      </View>
      <Modal
              visible={showNotificationModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowNotificationModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Notifications</Text>
                    <View style={styles.modalActions}>
                      {stats.pendingMessages > 0 && (
                        <TouchableOpacity
                          onPress={handleMarkAllRead}
                          style={styles.markReadButton}
                        >
                          <Text style={styles.markReadText}>Mark all read</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => setShowNotificationModal(false)}
                        style={styles.closeButton}
                      >
                        <Ionicons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
      
                  <FlatList
                    data={pendingMessages}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={renderEmptyNotifications}
                    contentContainerStyle={[
                      styles.notificationList,
                      pendingMessages.length === 0 && styles.emptyList
                    ]}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 15,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  roleText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoCards: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  infoCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
  },
  markReadText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  notificationList: {
    flexGrow: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9fafb',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
  },
});