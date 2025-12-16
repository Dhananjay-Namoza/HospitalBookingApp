import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import {
    mockAppointments,
    mockDoctorAvailability,
    mockUsers
} from '../../data/mockData';
import ApiService from '../../services/api.service';
export default function ReceptionMessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [replacementPatientId, setReplacementPatientId] = useState('');
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (newDate && selectedMessage) {
      generateAvailableSlots();
    }
  }, [newDate, selectedMessage]);

  const loadMessages = async () => {
  try {
    setLoading(true);
    const response = await ApiService.getReceptionMessages();
    
    if (response.success && response.messages) {
      setMessages(response.messages);
    }
  } catch (err) {
    console.error('Error loading messages:', err);
  } finally {
    setLoading(false);
  }
};

  const generateAvailableSlots = () => {
    const doctorId = selectedMessage.doctorId;
    const availability = mockDoctorAvailability[doctorId];
    if (!availability) return;

    const dayOfWeek = getDayOfWeek(newDate);
    const daySchedule = availability.workingHours[dayOfWeek];

    if (!daySchedule || daySchedule.available === false) {
      setAvailableSlots([]);
      return;
    }

    // Check if date is unavailable
    if (availability.unavailableDates.includes(newDate)) {
      setAvailableSlots([]);
      return;
    }

    // Generate available slots after 6 PM or next available day
    const slots = [];
    const slotDuration = daySchedule.slots || 30;
    let startHour = 18; // After 6 PM
    const endHour = parseInt(daySchedule.end.split(':')[0]);

    // If it's the same day and after working hours, suggest next day
    if (newDate === new Date().toISOString().split('T')[0] && 
        new Date().getHours() >= endHour) {
      // Suggest next available day
      const nextDay = new Date(newDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setNewDate(nextDay.toISOString().split('T')[0]);
      return;
    }

    // Generate slots from 6 PM onwards
    let currentTime = startHour * 60;
    const endTime = endHour * 60;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      if (isSlotAvailable(newDate, timeString, doctorId)) {
        slots.push(timeString);
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

  const isSlotAvailable = (date, time, doctorId) => {
    const existingAppointment = mockAppointments.find(apt => 
      apt.doctorId === doctorId && 
      apt.date === date && 
      apt.time === time && 
      apt.status !== 'cancelled'
    );
    return !existingAppointment;
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleReplace = (appointment) => {
    setSelectedAppointment(appointment);
    setShowReplaceModal(true);
  };

  const handleCancel = (appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel ${appointment.patientName}'s appointment?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Update appointment status
            const appointmentIndex = mockAppointments.findIndex(apt => apt.id === appointment.id);
            if (appointmentIndex !== -1) {
              mockAppointments[appointmentIndex].status = 'cancelled';
            }
            Alert.alert('Success', 'Appointment cancelled successfully');
          }
        }
      ]
    );
  };

  const confirmReschedule = async () => {
  if (!newDate || !newTime) {
    Alert.alert('Error', 'Please select date and time');
    return;
  }

  try {
    const response = await ApiService.updateAppointment(selectedAppointment.id, {
      date: newDate,
      time: newTime,
      isRescheduled: true,
      originalDate: selectedAppointment.date,
      rescheduledBy: 'reception'
    });
    
    if (response.success) {
      Alert.alert('Success', 'Appointment rescheduled successfully');
      setShowRescheduleModal(false);
      await loadMessages();
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to reschedule appointment');
  }
};

  const confirmReplace = () => {
    if (!replacementPatientId) {
      Alert.alert('Error', 'Please select a replacement patient');
      return;
    }

    const replacementPatient = mockUsers.find(u => u.id === parseInt(replacementPatientId));
    if (!replacementPatient) {
      Alert.alert('Error', 'Invalid patient ID');
      return;
    }

    const appointmentIndex = mockAppointments.findIndex(apt => apt.id === selectedAppointment.id);
    if (appointmentIndex !== -1) {
      // Update original appointment with new patient
      mockAppointments[appointmentIndex] = {
        ...mockAppointments[appointmentIndex],
        patientId: replacementPatient.id,
        patientName: replacementPatient.name,
        isReplaced: true,
        originalPatientId: selectedAppointment.patientId,
        replacedBy: 'reception'
      };

      // Create new appointment for original patient (to be scheduled later)
      const newAppointment = {
        id: Date.now(),
        patientId: selectedAppointment.patientId,
        patientName: selectedAppointment.patientName,
        doctorId: selectedAppointment.doctorId,
        doctorName: selectedAppointment.doctorName,
        date: '', // To be scheduled
        time: '',
        type: selectedAppointment.type,
        status: 'pending_reschedule',
        fee: selectedAppointment.fee,
        symptoms: selectedAppointment.symptoms,
        notes: 'Replaced due to doctor unavailability, needs rescheduling',
        bookingTime: new Date().toISOString(),
        isRescheduled: true,
        originalDate: selectedAppointment.date,
        rescheduledBy: 'reception'
      };

      mockAppointments.push(newAppointment);
    }

    Alert.alert('Success', 'Appointment replaced successfully');
    setShowReplaceModal(false);
    setReplacementPatientId('');
  };

const markMessageAsHandled = async (messageId) => {
  try {
    const response = await ApiService.updateReceptionMessage(messageId, {
      status: 'handled'
    });
    
    if (response.success) {
      await loadMessages();
      success('Message marked as handled');
    }
  } catch (err) {
    showError('Failed to update message');
  }
};

  const renderMessage = ({ item }) => (
    <View style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.messageDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'pending' ? '#FF9800' : '#4CAF50' }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.messageText}>{item.message}</Text>

      <View style={styles.affectedAppointmentsContainer}>
        <Text style={styles.affectedTitle}>
          Affected Appointments ({item.affectedAppointments.length})
        </Text>
        {item.affectedAppointments.map(appointmentId => {
          const appointment = mockAppointments.find(apt => apt.id === appointmentId);
          if (!appointment) return null;
          
          return (
            <View key={appointmentId} style={styles.affectedAppointment}>
              <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{appointment.patientName}</Text>
                <Text style={styles.appointmentTime}>
                  {appointment.date} at {appointment.time}
                </Text>
              </View>
              
              {item.status === 'pending' && (
                <View style={styles.appointmentActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rescheduleBtn]}
                    onPress={() => handleReschedule(appointment)}
                  >
                    <Text style={styles.actionBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.replaceBtn]}
                    onPress={() => handleReplace(appointment)}
                  >
                    <Text style={styles.actionBtnText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => handleCancel(appointment)}
                  >
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.markHandledBtn}
          onPress={() => markMessageAsHandled(item.id)}
        >
          <Text style={styles.markHandledBtnText}>Mark as Handled</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail-open-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No Messages</Text>
      <Text style={styles.emptySubtitle}>
        Doctor unavailability messages will appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unavailability Messages</Text>
        <View style={styles.headerStats}>
          <Text style={styles.pendingCount}>
            {messages.filter(m => m.status === 'pending').length} Pending
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          messages.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedAppointment && (
                <View style={styles.appointmentDetails}>
                  <Text style={styles.detailTitle}>Current Appointment</Text>
                  <Text style={styles.detailText}>
                    Patient: {selectedAppointment.patientName}
                  </Text>
                  <Text style={styles.detailText}>
                    Date: {selectedAppointment.date} at {selectedAppointment.time}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Select New Date</Text>
              <Calendar
                onDayPress={(day) => setNewDate(day.dateString)}
                markedDates={newDate ? {
                  [newDate]: { selected: true, selectedColor: '#2196F3' }
                } : {}}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  selectedDayBackgroundColor: '#2196F3',
                  todayTextColor: '#2196F3',
                  arrowColor: '#2196F3',
                }}
              />

              {availableSlots.length > 0 && (
                <View style={styles.slotsContainer}>
                  <Text style={styles.inputLabel}>Available Slots (After 6 PM)</Text>
                  <View style={styles.slotsGrid}>
                    {availableSlots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.slotBtn,
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

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowRescheduleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmReschedule}
                >
                  <Text style={styles.confirmButtonText}>Confirm Reschedule</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Replace Modal */}
      <Modal
        visible={showReplaceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReplaceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Replace Patient</Text>
              <TouchableOpacity onPress={() => setShowReplaceModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.replaceContainer}>
              <Text style={styles.inputLabel}>Replacement Patient ID</Text>
              <TextInput
                style={styles.textInput}
                value={replacementPatientId}
                onChangeText={setReplacementPatientId}
                placeholder="Enter patient ID"
                keyboardType="numeric"
              />
              
              <Text style={styles.noteText}>
                This will replace the current patient with the new patient for this time slot.
                The original patient will need to be rescheduled separately.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReplaceModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmReplace}
                >
                  <Text style={styles.confirmButtonText}>Confirm Replace</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    justifyContent: 'space-between',
    padding: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStats: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pendingCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  messageInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  affectedAppointmentsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  affectedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  affectedAppointment: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  appointmentInfo: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  appointmentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  rescheduleBtn: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  replaceBtn: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  cancelBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  markHandledBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  markHandledBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentDetails: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  slotsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
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
  replaceContainer: {
    padding: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  noteText: {
    fontSize: 12,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
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
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});
