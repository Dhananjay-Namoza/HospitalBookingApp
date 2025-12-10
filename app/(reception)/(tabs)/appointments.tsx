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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import ApiService from '../../../services/api.service';

export default function ReceptionAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [activeFilter, searchText, appointments]);

  useEffect(() => {
    if (newDate && selectedAppointment) {
      generateAvailableSlots();
    }
  }, [newDate, selectedAppointment]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAppointments();
      
      if (response.success && response.appointments) {
        setAppointments(response.appointments);
        setFilteredAppointments(response.appointments);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === activeFilter);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(apt =>
        apt.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const generateAvailableSlots = async () => {
    try {
      const availability = await ApiService.getDoctorAvailability(selectedAppointment.doctorId);
      
      if (availability.success && availability.availability) {
        const dayOfWeek = getDayOfWeek(newDate);
        const daySchedule = availability.availability.workingHours[dayOfWeek];

        if (!daySchedule || daySchedule.available === false) {
          setAvailableSlots([]);
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

        while (currentTime < endTime) {
          const hour = Math.floor(currentTime / 60);
          const minute = currentTime % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Check if slot is available
          const isBooked = appointments.some(apt =>
            apt.doctorId === selectedAppointment.doctorId &&
            apt.date === newDate &&
            apt.time === timeString &&
            apt.status !== 'cancelled'
          );

          if (!isBooked) {
            slots.push(timeString);
          }
          
          currentTime += slotDuration;
        }

        setAvailableSlots(slots);
      }
    } catch (err) {
      console.error('Error generating slots:', err);
    }
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setNewDate('');
    setNewTime('');
    setAvailableSlots([]);
    setShowRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    if (!newDate || !newTime) {
      Alert.alert('Error', 'Please select both date and time');
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
        await loadAppointments();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reschedule appointment');
    }
  };

  const handleCancel = (appointment: any) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel ${appointment.patientName}'s appointment?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.cancelAppointment(appointment.id);
              Alert.alert('Success', 'Appointment cancelled successfully');
              await loadAppointments();
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const renderAppointmentCard = ({ item }: { item: any }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
          <Text style={styles.appointmentDateTime}>
            {item.date} at {item.time}
          </Text>
          <Text style={styles.appointmentType}>{item.type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText}>{item.symptoms}</Text>
        </View>
      )}

      {item.isRescheduled && (
        <View style={styles.rescheduleInfo}>
          <Ionicons name="calendar-outline" size={14} color="#FF9800" />
          <Text style={styles.rescheduleText}>
            Rescheduled from {item.originalDate} by {item.rescheduledBy}
          </Text>
        </View>
      )}

      {item.status === 'upcoming' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => handleReschedule(item)}
          >
            <Ionicons name="calendar-outline" size={16} color="#2196F3" />
            <Text style={styles.actionButtonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancel(item)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#f44336" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'all' 
          ? 'No appointments found'
          : `No ${activeFilter} appointments`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Appointments</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient or doctor..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'upcoming', 'completed', 'cancelled'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
            <Text style={[styles.filterCount, activeFilter === filter && styles.activeFilterCount]}>
              {appointments.filter(apt => filter === 'all' || apt.status === filter).length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
        }
        contentContainerStyle={[
          styles.listContainer,
          filteredAppointments.length === 0 && styles.emptyList
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
                  <Text style={styles.detailText}>Patient: {selectedAppointment.patientName}</Text>
                  <Text style={styles.detailText}>Doctor: Dr. {selectedAppointment.doctorName}</Text>
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
                  <Text style={styles.inputLabel}>Available Time Slots</Text>
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

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
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
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming': return '#2196F3';
    case 'completed': return '#4CAF50';
    case 'cancelled': return '#f44336';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 3,
    backgroundColor: '#f8f9fa',
  },
  activeFilterTab: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  activeFilterCount: {
    color: '#E3F2FD',
  },
  listContainer: {
    padding: 15,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  appointmentDateTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  symptomsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 13,
    color: '#666',
  },
  rescheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  rescheduleText: {
    fontSize: 11,
    color: '#FF9800',
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  rescheduleButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
  },
  cancelModalButton: {
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