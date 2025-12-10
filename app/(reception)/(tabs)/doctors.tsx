import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../../services/api.service';

export default function ReceptionDoctorsScreen() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    speciality: '',
    experience: '',
    qualification: '',
    hospitalName: '',
    address: '',
    designation: 'Consultant'
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchText, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDoctors();
      
      if (response.success && response.doctors) {
        setDoctors(response.doctors);
        setFilteredDoctors(response.doctors);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    if (searchText === '') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter((doctor: any) =>
        doctor.name.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.speciality?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.speciality) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleAddDoctor = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await ApiService.createDoctor({
        ...formData,
        experience: parseInt(formData.experience) || 0,
      });

      if (response.success) {
        Alert.alert('Success', 'Doctor added successfully!');
        setShowAddModal(false);
        resetForm();
        await loadDoctors();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      speciality: '',
      experience: '',
      qualification: '',
      hospitalName: '',
      address: '',
      designation: 'Consultant'
    });
  };

  const renderDoctorCard = ({ item }: { item: any }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorAvatar}>
          <Ionicons name="medical" size={30} color="#2196F3" />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.doctorSpeciality}>{item.speciality}</Text>
          <View style={styles.doctorMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.experience || 0} years exp</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          </View>
        </View>
      </View>

      {item.qualification && (
        <View style={styles.qualificationContainer}>
          <Ionicons name="school-outline" size={14} color="#666" />
          <Text style={styles.qualificationText} numberOfLines={2}>{item.qualification}</Text>
        </View>
      )}

      <View style={styles.doctorFooter}>
        <View style={styles.hospitalInfo}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.hospitalText}>{item.hospitalName || 'Hospital'}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => Alert.alert('Details', `Doctor ID: ${item.id}\nEmail: ${item.email}`)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No Doctors Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchText ? `No doctors found matching "${searchText}"` : 'Add doctors to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{doctors.length}</Text>
          <Text style={styles.statLabel}>Total Doctors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {doctors.filter((d: any) => d.speciality === 'Cardiology').length}
          </Text>
          <Text style={styles.statLabel}>Cardiologists</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {doctors.filter((d: any) => (d.experience || 0) >= 10).length}
          </Text>
          <Text style={styles.statLabel}>Experienced</Text>
        </View>
      </View>

      {/* Doctors List */}
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorCard}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
        }
        contentContainerStyle={[
          styles.listContainer,
          filteredDoctors.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Doctor Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Doctor</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Dr. John Doe"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Phone *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  keyboardType="phone-pad"
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Password *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  secureTextEntry
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Speciality *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Cardiology, Neurology, etc."
                  value={formData.speciality}
                  onChangeText={(text) => setFormData({...formData, speciality: text})}
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Experience (Years)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  value={formData.experience}
                  onChangeText={(text) => setFormData({...formData, experience: text})}
                  keyboardType="numeric"
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Qualification</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="MBBS, MD, etc."
                  value={formData.qualification}
                  onChangeText={(text) => setFormData({...formData, qualification: text})}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Hospital Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="City Hospital"
                  value={formData.hospitalName}
                  onChangeText={(text) => setFormData({...formData, hospitalName: text})}
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Hospital address"
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />

                <Text style={styles.formLabel}>Designation</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Consultant, Senior Consultant, etc."
                  value={formData.designation}
                  onChangeText={(text) => setFormData({...formData, designation: text})}
                  editable={!loading}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                  onPress={handleAddDoctor}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Add Doctor</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    elevation: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpeciality: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 8,
  },
  doctorMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  qualificationContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  qualificationText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  doctorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  hospitalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hospitalText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 10,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});