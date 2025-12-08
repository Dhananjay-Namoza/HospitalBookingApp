import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useUser } from '../../context/UserContext';
// import { useToast } from '../../components/Toast/ToastContext';
import ApiService from '../../services/api.service';

export default function BookAppointmentScreen() {
  const { doctorId } = useLocalSearchParams();
  const { user } = useUser();
  // const { success, error: showError } = useToast();
  const success = (msg: string) => Alert.alert('Success', msg);
  const showError = (msg: string) => Alert.alert('Error', msg);
  const info = (msg: string) => Alert.alert('Info', msg);
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [symptoms, setSymptoms] = useState('');
  const [appointmentType, setAppointmentType] = useState('Consultation');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, []);

  useEffect(() => {
    if (selectedDate && availability) {
      generateAvailableSlots();
    }
  }, [selectedDate, availability]);

  const loadDoctorData = async () => {
    try {
      setFetchingData(true);
      const [doctorResponse, availabilityResponse] = await Promise.all([
        ApiService.getDoctorById(parseInt(doctorId as string)),
        ApiService.getDoctorAvailability(parseInt(doctorId as string))
      ]);

      if (doctorResponse.success && doctorResponse.doctor) {
        setDoctor(doctorResponse.doctor);
      }

      if (availabilityResponse.success && availabilityResponse.availability) {
        setAvailability(availabilityResponse.availability);
      }
    } catch (err: any) {
      console.error('Error loading doctor data:', err);
      showError(err.message || 'Failed to load doctor information');
    } finally {
      setFetchingData(false);
    }
  };

  const generateAvailableSlots = () => {
    if (!availability || !selectedDate) return;

    const dayOfWeek = getDayOfWeek(selectedDate);
    const daySchedule = availability.workingHours[dayOfWeek];

    if (!daySchedule || daySchedule.available === false) {
      setAvailableSlots([]);
      return;
    }

    // Check if date is unavailable
    if (availability.unavailableDates?.includes(selectedDate)) {
      setAvailableSlots([]);
      return;
    }

    // Generate all possible slots
    const slots = [];
    const slotDuration = daySchedule.slots || 30;
    const startHour = parseInt(daySchedule.start.split(':')[0]);
    const startMinute = parseInt(daySchedule.start.split(':')[1]);
    const endHour = parseInt(daySchedule.end.split(':')[0]);
    const endMinute = parseInt(daySchedule.end.split(':')[1]);

    let currentTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      slots.push({
        time: timeString,
        available: true,
        endTime: getEndTime(timeString, slotDuration)
      });
      
      currentTime += slotDuration;
    }

    setAvailableSlots(slots);
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getEndTime = (startTime, duration) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const getMarkedDates = () => {
    if (!availability) return {};

    const marked = {};
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Mark unavailable dates
    availability.unavailableDates?.forEach(date => {
      marked[date] = { disabled: true, disableTouchEvent: true };
    });

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#2196F3'
      };
    }

    return marked;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !symptoms.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const appointmentData = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        date: selectedDate,
        time: selectedTime,
        endTime: getEndTime(selectedTime, availability?.workingHours?.monday?.slots || 30),
        type: appointmentType,
        symptoms: symptoms.trim(),
        fee: availability?.consultationFee || 500,
      };

      const response = await ApiService.createAppointment(appointmentData);

      if (response.success) {
        setShowConfirmModal(false);
        Alert.alert(
          'Booking Confirmed! ✅',
          `Your appointment with ${doctor.name} is booked for ${selectedDate} at ${selectedTime}`,
          [
            {
              text: 'OK',
              onPress: () => router.push('/(patient)/(tabs)/appointments')
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to book appointment');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      Alert.alert('Error', err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading doctor information...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>Doctor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Doctor Info */}
      <View style={styles.doctorCard}>
        <View style={styles.doctorInfo}>
          <Ionicons name="medical" size={40} color="#2196F3" />
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpeciality}>{doctor.speciality}</Text>
            <Text style={styles.consultationFee}>
              Consultation Fee: ₹{availability?.consultationFee || 500}
            </Text>
          </View>
        </View>
      </View>

      {/* Appointment Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment Type</Text>
        <View style={styles.typeContainer}>
          {['Consultation', 'Follow-up', 'Check-up', 'Emergency'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                appointmentType === type && styles.selectedType
              ]}
              onPress={() => setAppointmentType(type)}
            >
              <Text style={[
                styles.typeText,
                appointmentType === type && styles.selectedTypeText
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={getMarkedDates()}
          minDate={new Date().toISOString().split('T')[0]}
          maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          theme={{
            selectedDayBackgroundColor: '#2196F3',
            todayTextColor: '#2196F3',
            arrowColor: '#2196F3',
          }}
        />
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          {availableSlots.length > 0 ? (
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.slotButton,
                    selectedTime === slot.time && styles.selectedSlot
                  ]}
                  onPress={() => setSelectedTime(slot.time)}
                >
                  <Text style={[
                    styles.slotText,
                    selectedTime === slot.time && styles.selectedSlotText
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="calendar-outline" size={40} color="#ccc" />
              <Text style={styles.noSlotsText}>No available slots for this date</Text>
              <Text style={styles.noSlotsSubtext}>Please select another date</Text>
            </View>
          )}
        </View>
      )}

      {/* Symptoms Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms / Reason for Visit *</Text>
        <TextInput
          style={styles.symptomsInput}
          multiline
          numberOfLines={4}
          placeholder="Please describe your symptoms or reason for the appointment..."
          value={symptoms}
          onChangeText={setSymptoms}
          maxLength={500}
        />
        <Text style={styles.charCount}>{symptoms.length}/500</Text>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedDate || !selectedTime || !symptoms.trim()) && styles.bookButtonDisabled
        ]}
        onPress={() => setShowConfirmModal(true)}
        disabled={!selectedDate || !selectedTime || !symptoms.trim()}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Appointment</Text>
            
            <View style={styles.confirmationDetails}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Doctor:</Text>
                <Text style={styles.confirmValue}>{doctor.name}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Date:</Text>
                <Text style={styles.confirmValue}>{selectedDate}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Time:</Text>
                <Text style={styles.confirmValue}>{selectedTime}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Type:</Text>
                <Text style={styles.confirmValue}>{appointmentType}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Fee:</Text>
                <Text style={styles.confirmValue}>
                  ₹{availability?.consultationFee || 500}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleBookAppointment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
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
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginTop: 10,
  },
  doctorCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetails: {
    marginLeft: 15,
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpeciality: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedType: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeText: {
    color: '#fff',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedSlot: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  slotText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedSlotText: {
    color: '#fff',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  symptomsInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  bookButton: {
    backgroundColor: '#2196F3',
    margin: 15,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationDetails: {
    marginBottom: 25,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  confirmLabel: {
    fontSize: 16,
    color: '#666',
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 8,
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