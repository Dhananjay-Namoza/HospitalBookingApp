import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';

export default function DoctorProfileScreen() {
  const { user, setUser, logout } = useUser();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    speciality: user?.speciality || '',
    experience: user?.experience?.toString() || '',
    qualification: user?.qualification || '',
    hospitalName: user?.hospitalName || '',
    address: user?.address || '',
  });
  const [availableForConsultation, setAvailableForConsultation] = useState(true);
  const [acceptNewPatients, setAcceptNewPatients] = useState(true);
  const router = useRouter();
  const handleSave = () => {
    const updatedUser = {
      ...user,
      ...formData,
      experience: parseInt(formData.experience) || 0,
    };
    
    setUser(updatedUser);
    setEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
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
        editable={editing}
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
          <View style={styles.doctorBadge}>
            <Ionicons name="medical" size={16} color="#fff" />
          </View>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userSpeciality}>{user?.speciality}</Text>
        <View style={styles.doctorTag}>
          <Ionicons name="medical" size={14} color="#2196F3" />
          <Text style={styles.doctorText}>Verified Doctor</Text>
        </View>
      </View>

      {/* Professional Information */}
      {renderProfileSection('Professional Information', (
        <>
          {renderInputField('Full Name', formData.name, 'name', 'Enter your full name')}
          {renderInputField('Email', formData.email, 'email', 'Enter your email')}
          {renderInputField('Phone', formData.phone, 'phone', 'Enter your phone number')}
          {renderInputField('Speciality', formData.speciality, 'speciality', 'Enter your speciality')}
          {renderInputField('Experience (Years)', formData.experience, 'experience', 'Years of experience')}
          {renderInputField(
            'Qualification', 
            formData.qualification, 
            'qualification', 
            'Enter your qualifications',
            true
          )}
        </>
      ))}

      {/* Hospital Information */}
      {renderProfileSection('Hospital Information', (
        <>
          {renderInputField('Hospital Name', formData.hospitalName, 'hospitalName', 'Enter hospital name')}
          {renderInputField(
            'Address', 
            formData.address, 
            'address', 
            'Enter hospital address',
            true
          )}
        </>
      ))}

      {/* Settings */}
      {renderProfileSection('Consultation Settings', (
        <View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="medical-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Available for Consultation</Text>
                <Text style={styles.settingSubtitle}>Patients can book appointments</Text>
              </View>
            </View>
            <Switch
              value={availableForConsultation}
              onValueChange={setAvailableForConsultation}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={availableForConsultation ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="person-add-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Accept New Patients</Text>
                <Text style={styles.settingSubtitle}>Allow new patient registrations</Text>
              </View>
            </View>
            <Switch
              value={acceptNewPatients}
              onValueChange={setAcceptNewPatients}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={acceptNewPatients ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/(doctor)/manage-availability')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="calendar-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Manage Schedule</Text>
                <Text style={styles.settingSubtitle}>Set your available time slots</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      ))}

      {/* General Settings */}
      {renderProfileSection('General Settings', (
        <View>
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

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Help', 'Help & Support will be available soon!')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={24} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSubtitle}>Get help and contact support</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
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
                // Reset form data
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  speciality: user?.speciality || '',
                  experience: user?.experience?.toString() || '',
                  qualification: user?.qualification || '',
                  hospitalName: user?.hospitalName || '',
                  address: user?.address || '',
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
        >
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Doctor Portal v1.0.0</Text>
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
  doctorBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#2196F3',
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
  userSpeciality: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 10,
  },
  doctorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  doctorText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 4,
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
