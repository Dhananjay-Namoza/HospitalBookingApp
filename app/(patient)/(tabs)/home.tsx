import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import { useToast } from '../../../components/Toast/ToastContext';
import { DoctorCardSkeleton } from '../../../components/Skeletons/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import ApiService from '../../../services/api.service';

export default function HomeScreen() {
  const [doctors, setDoctors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  //  const { success, error, info } = useToast();
  const success = (msg: string) => Alert.alert('Success', msg);
  const error = (msg: string) => Alert.alert('Error', msg);
  const info = (msg: string) => Alert.alert('Info', msg);

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
        success('Doctors loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to load doctors');
      }
    } catch (err: any) {
      console.error('Error loading doctors:', err);
      error(err.message || 'Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    if (searchText === '') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.speciality?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDoctors();
    } catch (err) {
      error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const renderDoctorCard = ({ item }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => router.push({
        pathname: '/(patient)/doctor-detail',
        params: { doctorId: item.id }
      })}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face' }} 
        style={styles.doctorImage} 
      />
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpeciality}>{item.speciality}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating || 4.5}</Text>
          <Text style={styles.reviews}>({item.reviews || 0} reviews)</Text>
        </View>
        <Text style={styles.experience}>{item.experience || 0} years experience</Text>
        <View style={styles.availabilityContainer}>
          <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
          <Text style={styles.availability}>Available Today</Text>
        </View>
      </View>
      <View style={styles.consultationFee}>
        <Text style={styles.feeText}>₹{item.consultationFee || 500}</Text>
        <Text style={styles.feeLabel}>Consultation</Text>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: '/(patient)/book-appointment',
              params: { doctorId: item.id }
            });
          }}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSkeletonLoader = () => (
    <View>
      <DoctorCardSkeleton />
      <DoctorCardSkeleton />
      <DoctorCardSkeleton />
      <DoctorCardSkeleton />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, specialities..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.specialitiesContainer}>
        <Text style={styles.sectionTitle}>Popular Specialities</Text>
        <View style={styles.specialitiesGrid}>
          {['Cardiology', 'Neurology', 'Pediatrics', 'Dermatology'].map((specialty) => (
            <TouchableOpacity 
              key={specialty} 
              style={styles.specialityChip}
              onPress={() => setSearchText(specialty)}
            >
              <Text style={styles.specialityText}>{specialty}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Available Doctors</Text>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="search-outline"
      title="No doctors found"
      description={searchText 
        ? `No doctors found matching "${searchText}". Try a different search term.`
        : "No doctors available at the moment. Please try again later."
      }
      actionText={searchText ? "Clear Search" : "Refresh"}
      onAction={() => {
        if (searchText) {
          setSearchText('');
        } else {
          loadDoctors();
        }
      }}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderSkeletonLoader()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          filteredDoctors.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
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
  specialitiesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  specialitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specialityChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  specialityText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    flexDirection: 'row',
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
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
    marginBottom: 6,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  experience: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availability: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  consultationFee: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  feeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  feeLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  bookButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});