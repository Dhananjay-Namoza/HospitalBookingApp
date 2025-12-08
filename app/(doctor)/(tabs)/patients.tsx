import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PatientCardSkeleton } from '../../../components/Skeletons/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import ApiService from '../../../services/api.service';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  bloodGroup?: string;
  allergies?: string[];
  diseases?: string[];
  lastVisit: string;
  nextAppointment?: string;
  isPremium?: boolean;
}

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const showError = (message: string) => {
    Alert.alert('Error', message);
  };
  const success = (message: string) => {
    Alert.alert('Success', message);
  };
  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchText, patients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDoctorPatients();
      
      if (response.success && response.patients) {
        setPatients(response.patients);
        setFilteredPatients(response.patients);
        success('Patients loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to load patients');
      }
    } catch (err: any) {
      console.error('Error loading patients:', err);
      showError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (searchText === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchText.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPatients();
    } catch (err) {
      showError('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePatientPress = (patient: Patient) => {
    router.push({
      pathname: '/(doctor)/patient-detail',
      params: { patientId: patient.id }
    });
  };

  const handleMessagePress = (patient: Patient) => {
    if (!patient.isPremium) {
      Alert.alert(
        'Premium Required',
        'This patient needs a premium membership to chat with doctors.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/(doctor)/chat/[id]',
      params: { id: patient.id, type: 'patient' }
    });
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <View style={styles.patientCard}>
      <TouchableOpacity 
        style={styles.patientInfo}
        onPress={() => handlePatientPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.patientHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={50} color="#2196F3" />
            {item.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
            )}
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientEmail}>{item.email}</Text>
            <Text style={styles.patientPhone}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.medicalInfo}>
          {item.bloodGroup && (
            <View style={styles.infoChip}>
              <Ionicons name="water" size={14} color="#f44336" />
              <Text style={styles.infoText}>{item.bloodGroup}</Text>
            </View>
          )}
          {item.allergies && item.allergies.length > 0 && (
            <View style={[styles.infoChip, styles.allergyChip]}>
              <Ionicons name="warning" size={14} color="#FF9800" />
              <Text style={styles.infoText}>Allergies</Text>
            </View>
          )}
          {item.diseases && item.diseases.length > 0 && (
            <View style={[styles.infoChip, styles.diseaseChip]}>
              <Ionicons name="medical" size={14} color="#9C27B0" />
              <Text style={styles.infoText}>Conditions</Text>
            </View>
          )}
        </View>

        <View style={styles.appointmentInfo}>
          <View style={styles.visitInfo}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.visitText}>Last: {item.lastVisit}</Text>
          </View>
          {item.nextAppointment && (
            <View style={styles.visitInfo}>
              <Ionicons name="calendar-outline" size={16} color="#2196F3" />
              <Text style={[styles.visitText, styles.nextAppointment]}>
                Next: {item.nextAppointment}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handlePatientPress(item)}
        >
          <Ionicons name="document-text-outline" size={18} color="#2196F3" />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            !item.isPremium && styles.actionButtonDisabled
          ]}
          onPress={() => handleMessagePress(item)}
          disabled={!item.isPremium}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={18} 
            color={item.isPremium ? "#2196F3" : "#ccc"} 
          />
          <Text style={[
            styles.actionButtonText,
            !item.isPremium && styles.actionButtonTextDisabled
          ]}>
            Message
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="people-outline"
      title="No patients found"
      description={searchText 
        ? `No patients found matching "${searchText}"`
        : "Patients will appear here once they book appointments with you"
      }
      actionText={searchText ? "Clear Search" : null}
      onAction={searchText ? () => setSearchText('') : null}
    />
  );

  const renderSkeletonLoader = () => (
    <View style={styles.listContainer}>
      <PatientCardSkeleton />
      <PatientCardSkeleton />
      <PatientCardSkeleton />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name or email..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {patients.filter(p => p.nextAppointment).length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {patients.filter(p => p.isPremium).length}
          </Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>
      </View>

      {loading ? (
        renderSkeletonLoader()
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id.toString()}
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
            filteredPatients.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  patientInfo: {
    padding: 20,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
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
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
  },
  medicalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  allergyChip: {
    backgroundColor: '#FFF3E0',
  },
  diseaseChip: {
    backgroundColor: '#F3E5F5',
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginLeft: 4,
  },
  appointmentInfo: {
    marginTop: 10,
  },
  visitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  visitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  nextAppointment: {
    color: '#2196F3',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRightWidth: 0.5,
    borderRightColor: '#f0f0f0',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonTextDisabled: {
    color: '#ccc',
  },
});