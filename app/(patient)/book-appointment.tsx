import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useUser } from '../../context/UserContext';
import { useAppointments } from '../../context/AppointmentContext';
import { mockDoctors, mockDoctorAvailability } from '../../data/mockData';

export default function BookAppointmentScreen() {
  const { doctorId } = useLocalSearchParams();
  const { user } = useUser();
  const { appointments, addAppointment } = useAppointments();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [symptoms, setSymptoms] = useState('');
  const [appointmentType, setAppointmentType] = useState('Consultation');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundDoctor = mockDoctors.find(d => d.id === parseInt(doctorId as string));
    setDoctor(foundDoctor);
  }, []);

  useEffect(() => {
    if (selectedDate && doctor) {
      generateAvailableSlots();
    }
  }, [selectedDate, doctor]);

  const generateAvailableSlots = () => {
    const availability = mockDoctorAvailability[doctor.id];
    console.log('Doctor Availability:', availability);
    if (!availability) return;
    console.log('Selected Date:', selectedDate);
    const dayOfWeek = getDayOfWeek(selectedDate);
    const daySchedule = availability.workingHours[dayOfWeek];

    if (!daySchedule || daySchedule.available === false) {
      setAvailableSlots([]);
      return;
    }

    // Check if date is unavailable
    if (availability.unavailableDates.includes(selectedDate)) {
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
      
      // Check if slot is available
      if (isSlotAvailable(selectedDate, timeString)) {
        slots.push({
          time: timeString,
          available: true,
          endTime: getEndTime(timeString, slotDuration)
        });
      }
      
      currentTime += slotDuration;
    }

    setAvailableSlots(slots);
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const isSlotAvailable = (date, time) => {
    const availability = mockDoctorAvailability[doctor.id];
    
    // Check unavailable periods
    const unavailablePeriod = availability.unavailablePeriods.find(period => 
      period.date === date && 
      time >= period.startTime && 
      time < period.endTime
    );

    if (unavailablePeriod) return false;

    // Check existing appointments
    const existingAppointment = appointments.find(apt => 
      apt.doctorId === doctor.id && 
      apt.date === date && 
      apt.time === time && 
      apt.status !== 'cancelled'
    );

    return !existingAppointment;
  };

  const getEndTime = (startTime, duration) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const getMarkedDates = () => {
    const availability = mockDoctorAvailability[doctor?.id];
    if (!availability) return {};

    const marked = {};
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Mark unavailable dates
    availability.unavailableDates.forEach(date => {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newAppointment = {
        patientId: user.id,
        patientName: user.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        date: selectedDate,
        time: selectedTime,
        endTime: getEndTime(selectedTime, mockDoctorAvailability[doctor.id].workingHours.monday.slots),
        type: appointmentType,
        status: 'upcoming',
        fee: mockDoctorAvailability[doctor.id].consultationFee,
        symptoms,
        notes: '',
        bookingTime: new Date().toISOString(),
        isRescheduled: false,
        originalDate: null,
        rescheduledBy: null
      };

      // Add to appointments context
      const success = await addAppointment(newAppointment);
      
      if (success) {
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
        throw new Error('Failed to save appointment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading doctor information...</Text>
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
              Consultation Fee: ₹{mockDoctorAvailability[doctor.id]?.consultationFee || 500}
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
                  ₹{mockDoctorAvailability[doctor.id]?.consultationFee || 500}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleBookAppointment}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Booking...' : 'Confirm'}
                </Text>
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
