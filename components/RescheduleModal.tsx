import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import ApiService from '../services/api.service';

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: any;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  onClose,
  appointment,
  onSuccess
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    if (newDate && appointment) {
      generateAvailableSlots();
    }
  }, [newDate]);

  const generateAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDoctorAvailability(appointment.doctorId);
      
      if (response.success && response.availability) {
        setAvailability(response.availability);
        const dayOfWeek = getDayOfWeek(newDate);
        const daySchedule = response.availability.workingHours[dayOfWeek];

        if (!daySchedule || daySchedule.available === false) {
          setAvailableSlots([]);
          Alert.alert('Not Available', 'Doctor is not available on this day');
          return;
        }

        // Check if date is unavailable
        if (response.availability.unavailableDates?.includes(newDate)) {
          setAvailableSlots([]);
          Alert.alert('Not Available', 'Doctor is unavailable on this date');
          return;
        }

        // Generate slots
        const slots = [];
        const slotDuration = daySchedule.slots || 30;
        const startHour = parseInt(daySchedule.start.split(':')[0]);
        const startMinute = parseInt(daySchedule.start.split(':')[1]);
        const endHour = parseInt(daySchedule.end.split(':')[0]);
        const endMinute = parseInt(daySchedule.end.split(':')[1]);

        let currentTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        // Get all appointments for this doctor on this date
        const appointmentsResponse = await ApiService.getAppointments({
          doctorId: appointment.doctorId,
          date: newDate
        });

        const bookedSlots = appointmentsResponse.success 
          ? appointmentsResponse.appointments
              .filter((apt: any) => apt.status !== 'cancelled')
              .map((apt: any) => apt.time)
          : [];

        while (currentTime < endTime) {
          const hour = Math.floor(currentTime / 60);
          const minute = currentTime % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          if (!bookedSlots.includes(timeString)) {
            slots.push(timeString);
          }
          
          currentTime += slotDuration;
        }

        setAvailableSlots(slots);
      }
    } catch (err) {
      console.error('Error generating slots:', err);
      Alert.alert('Error', 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const handleConfirm = async () => {
    if (!newDate || !newTime) {
      Alert.alert('Error', 'Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.updateAppointment(appointment.id, {
        date: newDate,
        time: newTime,
        isRescheduled: true,
        originalDate: appointment.date,
        originalTime: appointment.time,
        rescheduledBy: 'patient'
      });

      if (response.success) {
        Alert.alert('Success', 'Appointment rescheduled successfully!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    if (availability) {
      // Mark unavailable dates
      availability.unavailableDates?.forEach((date: string) => {
        marked[date] = {
          disabled: true,
          disableTouchEvent: true,
          textColor: '#ccc'
        };
      });
    }

    // Mark selected date
    if (newDate) {
      marked[newDate] = {
        selected: true,
        selectedColor: '#2196F3'
      };
    }

    return marked;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {appointment && (
              <View style={styles.currentAppointment}>
                <Text style={styles.sectionLabel}>Current Appointment</Text>
                <View style={styles.appointmentCard}>
                  <View style={styles.appointmentRow}>
                    <Ionicons name="person-outline" size={18} color="#2196F3" />
                    <Text style={styles.appointmentText}>Dr. {appointment.doctorName}</Text>
                  </View>
                  <View style={styles.appointmentRow}>
                    <Ionicons name="calendar-outline" size={18} color="#2196F3" />
                    <Text style={styles.appointmentText}>{appointment.date}</Text>
                  </View>
                  <View style={styles.appointmentRow}>
                    <Ionicons name="time-outline" size={18} color="#2196F3" />
                    <Text style={styles.appointmentText}>{appointment.time}</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.sectionLabel}>Select New Date</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setNewDate(day.dateString);
                  setNewTime('');
                }}
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

            {loading && newDate && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.loadingText}>Loading available slots...</Text>
              </View>
            )}

            {!loading && availableSlots.length > 0 && (
              <View style={styles.slotsSection}>
                <Text style={styles.sectionLabel}>Available Time Slots</Text>
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotButton,
                        newTime === slot && styles.selectedSlot
                      ]}
                      onPress={() => setNewTime(slot)}
                    >
                      <Text style={[
                        styles.slotText,
                        newTime === slot && styles.selectedSlotText
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {!loading && newDate && availableSlots.length === 0 && (
              <View style={styles.noSlotsContainer}>
                <Ionicons name="calendar-outline" size={40} color="#ccc" />
                <Text style={styles.noSlotsText}>No available slots</Text>
                <Text style={styles.noSlotsSubtext}>Please select another date</Text>
              </View>
            )}

            {newDate && newTime && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>New Appointment Details</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Ionicons name="calendar" size={18} color="#4CAF50" />
                    <Text style={styles.summaryText}>{newDate}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="time" size={18} color="#4CAF50" />
                    <Text style={styles.summaryText}>{newTime}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!newDate || !newTime || loading) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={!newDate || !newTime || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Reschedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  currentAppointment: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  calendarContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  slotsSection: {
    padding: 20,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 90,
    alignItems: 'center',
  },
  selectedSlot: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  slotText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  selectedSlotText: {
    color: '#fff',
  },
  noSlotsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 10,
  },
  cancelButton: {
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