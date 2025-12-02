import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mockDoctors, mockReviews } from '../../data/mockData';

export default function DoctorDetailScreen() {
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = () => {
    const foundDoctor = mockDoctors.find(d => d.id === parseInt(doctorId as string));
    const doctorReviews = mockReviews[parseInt(doctorId as string)] || [];
    
    setDoctor(foundDoctor);
    setReviews(doctorReviews);
    setLoading(false);
  };

  const handleCall = () => {
    if (doctor?.phone) {
      Linking.openURL(`tel:${doctor.phone}`);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.aboutText}>{doctor?.about}</Text>
      
      <Text style={styles.sectionTitle}>Qualifications</Text>
      <View style={styles.qualificationsList}>
        {doctor?.qualifications?.map((qualification, index) => (
          <View key={index} style={styles.qualificationItem}>
            <Ionicons name="school-outline" size={16} color="#2196F3" />
            <Text style={styles.qualificationText}>{qualification}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Languages</Text>
      <View style={styles.languagesList}>
        {doctor?.languages?.map((language, index) => (
          <View key={index} style={styles.languageChip}>
            <Text style={styles.languageText}>{language}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Awards & Recognition</Text>
      <View style={styles.awardsList}>
        {doctor?.awards?.map((award, index) => (
          <View key={index} style={styles.awardItem}>
            <Ionicons name="trophy-outline" size={16} color="#FFD700" />
            <Text style={styles.awardText}>{award}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Patient Reviews</Text>
      {reviews.length > 0 ? (
        reviews.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.patientName}</Text>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noReviewsText}>No reviews yet</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading doctor details...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>Doctor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Header */}
        <View style={styles.doctorHeader}>
          <Image source={{ uri: doctor.image }} style={styles.doctorImage} />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpeciality}>{doctor.speciality}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.rating}>
                {renderStars(doctor.rating)}
                <Text style={styles.ratingText}>{doctor.rating}</Text>
              </View>
              <Text style={styles.reviewCount}>({doctor.reviews} reviews)</Text>
            </View>
            <Text style={styles.experience}>{doctor.experience} years experience</Text>
          </View>
        </View>

        {/* Hospital Info */}
        <View style={styles.hospitalInfo}>
          <View style={styles.hospitalRow}>
            <Ionicons name="business-outline" size={20} color="#666" />
            <Text style={styles.hospitalName}>{doctor.hospitalName}</Text>
          </View>
          <View style={styles.hospitalRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.hospitalAddress}>{doctor.address}</Text>
          </View>
        </View>

        {/* Fee Info */}
        <View style={styles.feeContainer}>
          <View style={styles.feeInfo}>
            <Ionicons name="card-outline" size={24} color="#2196F3" />
            <View style={styles.feeText}>
              <Text style={styles.feeAmount}>₹{doctor.consultationFee}</Text>
              <Text style={styles.feeLabel}>Consultation Fee</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' ? renderAboutTab() : renderReviewsTab()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
  style={styles.bookAppointmentButton}
  onPress={() => router.push({
    pathname: '/(patient)/book-appointment',
    params: { doctorId: doctor.id }
  })}
>
  <Text style={styles.bookAppointmentButtonText}>Book Appointment</Text>
</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  doctorHeader: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpeciality: {
    fontSize: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  experience: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  hospitalInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hospitalName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  hospitalAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  feeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feeText: {
    marginLeft: 15,
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  qualificationsList: {
    marginBottom: 20,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qualificationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  languageChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '500',
  },
  awardsList: {
    marginBottom: 20,
  },
  awardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  awardText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  bottomActions: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookAppointmentButton: {
  backgroundColor: '#2196F3',
  paddingVertical: 15,
  borderRadius: 12,
  alignItems: 'center',
  margin: 15,
  elevation: 2,
},
bookAppointmentButtonText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
}
});
