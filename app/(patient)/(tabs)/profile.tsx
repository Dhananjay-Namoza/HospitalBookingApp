import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
import ApiService from '../../../services/api.service';

const RECEPTION_USER_ID = 201;

export default function ProfileScreen() {
  const { user, setUser, logout } = useUser();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    emergencyContact: user?.emergencyContact || '',
    allergies: user?.allergies?.join(', ') || '',
    diseases: user?.diseases?.join(', ') || '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ApiService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        setFormData({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          bloodGroup: response.user.bloodGroup || '',
          emergencyContact: response.user.emergencyContact || '',
          allergies: response.user.allergies?.join(', ') || '',
          diseases: response.user.diseases?.join(', ') || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updates = {
        name: formData.name,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact,
        allergies: formData.allergies.split(',').map(item => item.trim()).filter(item => item),
        diseases: formData.diseases.split(',').map(item => item.trim()).filter(item => item),
      };

      const response = await ApiService.updateProfile(updates);
      
      if (response.success) {
        setUser(response.user);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContactReception = async () => {
    try {
      setLoading(true);
      console.log('Contacting reception...');
      // Check if chat with reception already exists
      const chatsResponse = await ApiService.getChats();
      
      if (chatsResponse.success && chatsResponse.chats) {
        const receptionChat = chatsResponse.chats.find(
          (chat: any) => chat.otherUser?._id === RECEPTION_USER_ID || 
                         chat.otherUser?.id === RECEPTION_USER_ID
        );
        if (receptionChat) {
          router.push({
            pathname: '/(patient)/chat/[id]',
            params: { 
              id: receptionChat.chatId || receptionChat.id,
              chat: JSON.stringify(receptionChat),
              type: 'reception'
            }
          });
          return;
        }
      }
      console.log('No existing chat with reception found, creating new one...');
      // Create new chat with reception
      const createResponse = await ApiService.createChat({
        otherUserId: RECEPTION_USER_ID,
      });
      console.log('Create chat response:', createResponse);
      if (createResponse.success && createResponse.chat) {
        router.push({
          pathname: '/(patient)/chat/[id]',
          params: { 
            id: createResponse.chat._id || createResponse.chat.id,
            chat: JSON.stringify(createResponse),
            type: 'reception'
          }
        });
      } else {
        throw new Error('Failed to create chat with reception');
      }
      
    } catch (error: any) {
      console.error('Error contacting reception:', error);
      Alert.alert('Error', error.message || 'Failed to contact reception');
    } finally {
      setLoading(false);
    }
  };

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

  const renderProfileSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInputField = (
    label: string, 
    value: string, 
    key: string, 
    placeholder?: string,
    multiline?: boolean
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
        placeholder={placeholder}
        editable={editing && !loading}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#2196F3" />
          {user?.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.isPremium && (
          <View style={styles.premiumTag}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.premiumText}>Premium Member</Text>
          </View>
        )}
      </View>

      {/* Contact Reception Button */}
      <View style={styles.contactReceptionContainer}>
        <TouchableOpacity 
          style={styles.contactReceptionButton}
          onPress={handleContactReception}
          disabled={loading}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#2196F3" />
          <Text style={styles.contactReceptionText}>Contact Reception</Text>
          {loading && <ActivityIndicator size="small" color="#2196F3" style={styles.loadingIcon} />}
        </TouchableOpacity>
      </View>

      {/* Personal Information */}
      {renderProfileSection('Personal Information', (
        <>
          {renderInputField('Full Name', formData.name, 'name', 'Enter your full name')}
          {renderInputField('Email', formData.email, 'email', 'Enter your email')}
          {renderInputField('Phone', formData.phone, 'phone', 'Enter your phone number')}
          {renderInputField('Blood Group', formData.bloodGroup, 'bloodGroup', 'Enter your blood group')}
          {renderInputField('Emergency Contact', formData.emergencyContact, 'emergencyContact', 'Enter emergency contact')}
        </>
      ))}

      {/* Medical Information */}
      {renderProfileSection('Medical Information', (
        <>
          {renderInputField(
            'Allergies', 
            formData.allergies, 
            'allergies', 
            'Enter allergies separated by commas',
            true
          )}
          {renderInputField(
            'Medical Conditions', 
            formData.diseases, 
            'diseases', 
            'Enter medical conditions separated by commas',
            true
          )}
        </>
      ))}

      {/* Settings */}
      {renderProfileSection('Settings', (
        <View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive appointment reminders</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available soon!')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="shield-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSubtitle}>View our privacy policy</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Terms', 'Terms of service will be available soon!')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Terms of Service</Text>
                <Text style={styles.settingSubtitle}>View terms and conditions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {!user?.isPremium && (
            <TouchableOpacity 
              style={[styles.settingRow, styles.upgradeRow]}
              onPress={() => Alert.alert('Upgrade', 'Premium upgrade will be available soon!')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="star-outline" size={24} color="#FFD700" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Upgrade to Premium</Text>
                  <Text style={styles.settingSubtitle}>Chat with doctors and more benefits</Text>
                </View>
              </View>
              <View style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {editing ? (
          <View style={styles.editingButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  bloodGroup: user?.bloodGroup || '',
                  emergencyContact: user?.emergencyContact || '',
                  allergies: user?.allergies?.join(', ') || '',
                  diseases: user?.diseases?.join(', ') || '',
                });
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.editButton]}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="create-outline" size={20} color="#2196F3" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
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
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
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
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumText: {
    fontSize: 12,
    color: '#F57F17',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  contactReceptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  contactReceptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 1,
  },
  contactReceptionText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  inputGroup: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
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
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  upgradeRow: {
    backgroundColor: '#FFF9C4',
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#F57F17',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  editingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  editButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FFEBEE',
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
});