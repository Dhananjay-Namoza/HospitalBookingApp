import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useUser } from '../../context/UserContext';
import ApiService from './../../services/api.service';

export default function ManageAvailabilityScreen() {
  const { user } = useUser();
  const [availability, setAvailability] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [unavailabilityType, setUnavailabilityType] = useState('full_day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [affectedAppointments, setAffectedAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    loadAvailability();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      checkAffectedAppointments();
    }
  }, [selectedDate, unavailabilityType, startTime, endTime]);

  const loadAvailability = async () => {
  try {
    const response = await ApiService.getDoctorAvailability(user.id);
    if (response.success && response.availability) {
      setAvailability(response.availability);
    }
  } catch (err) {
    console.error('Error loading availability:', err);
  }
};
  const checkAffectedAppointments = () => {
    if (!selectedDate) return;
  };

  const handleMarkUnavailable = async () => {
  if (!selectedDate || !reason.trim()) {
    Alert.alert('Error', 'Please select a date and provide a reason');
    return;
  }

  try {
    setLoading(true);
    const unavailabilityData = {
      date: selectedDate,
      type: unavailabilityType,
      startTime: unavailabilityType === 'partial' ? startTime : undefined,
      endTime: unavailabilityType === 'partial' ? endTime : undefined,
      reason,
      affectedAppointments: affectedAppointments.map(apt => apt.id),
    };

    const response = await ApiService.markDoctorUnavailable(unavailabilityData);
    
    if (response.success) {
      Alert.alert(
        'Unavailability Marked',
        'Reception has been notified and will handle appointment rescheduling.',
        [{ text: 'OK', onPress: () => setShowUnavailabilityModal(false) }]
      );
      await loadAvailability();
    }
  } catch (err) {
    Alert.alert('Error', 'Failed to mark unavailability');
  } finally {
    setLoading(false);
  }
};

  const confirmUnavailability = () => {
    // Create unavailability message for reception
    const message = {
      id: Date.now(),
      doctorId: user.id,
      doctorName: user.name,
      date: selectedDate,
      type: unavailabilityType,
      startTime: unavailabilityType === 'partial' ? startTime : null,
      endTime: unavailabilityType === 'partial' ? endTime : null,
      reason,
      affectedAppointments: affectedAppointments.map(apt => apt.id),
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: `Unable to attend appointments on ${selectedDate}${unavailabilityType === 'partial' ? ` from ${startTime} to ${endTime}` : ''}. Reason: ${reason}. Please reschedule affected appointments.`
    };

    // Add to mock data
    mockUnavailabilityMessages.push(message);

    // Update availability
    if (unavailabilityType === 'full_day') {
      availability.unavailableDates.push(selectedDate);
    } else {
      availability.unavailablePeriods.push({
        date: selectedDate,
        startTime,
        endTime,
        reason
      });
    }

    Alert.alert(
      'Unavailability Marked',
      'Reception has been notified and will handle appointment rescheduling.',
      [{ text: 'OK', onPress: () => setShowUnavailabilityModal(false) }]
    );

    // Reset form
    setSelectedDate('');
    setStartTime('');
    setEndTime('');
    setReason('');
    setAffectedAppointments([]);
  };

  const renderWorkingHours = () => {
    if (!availability) return null;

    const days = Object.keys(availability.workingHours);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Hours</Text>
        {days.map(day => {
          const daySchedule = availability.workingHours[day];
          return (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayName}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>
              {daySchedule.available === false ? (
                <Text style={styles.unavailableText}>Not Available</Text>
              ) : (
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>
                    {daySchedule.start} - {daySchedule.end}
                  </Text>
                  <Text style={styles.slotDuration}>
                    ({daySchedule.slots}min slots)
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderUnavailableDates = () => {
    if (!availability || availability.unavailableDates.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unavailable Dates</Text>
        {availability.unavailableDates.map((date, index) => (
          <View key={index} style={styles.unavailableDateRow}>
            <Ionicons name="close-circle" size={20} color="#f44336" />
            <Text style={styles.unavailableDateText}>{date}</Text>
            <TouchableOpacity
              onPress={() => {
                availability.unavailableDates.splice(index, 1);
                setAvailability({...availability});
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderUnavailablePeriods = () => {
    if (!availability || availability.unavailablePeriods.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unavailable Periods</Text>
        {availability.unavailablePeriods.map((period, index) => (
          <View key={index} style={styles.unavailablePeriodRow}>
            <View style={styles.periodInfo}>
              <Text style={styles.periodDate}>{period.date}</Text>
              <Text style={styles.periodTime}>
                {period.startTime} - {period.endTime}
              </Text>
              <Text style={styles.periodReason}>{period.reason}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                availability.unavailablePeriods.splice(index, 1);
                setAvailability({...availability});
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const getMarkedDates = () => {
    const marked = {};
    
    if (availability) {
      // Mark unavailable dates
      availability.unavailableDates.forEach(date => {
        marked[date] = {
          selected: true,
          selectedColor: '#f44336',
          selectedTextColor: '#fff'
        };
      });

      // Mark dates with unavailable periods
      availability.unavailablePeriods.forEach(period => {
        if (!marked[period.date]) {
          marked[period.date] = {
            selected: true,
            selectedColor: '#FF9800',
            selectedTextColor: '#fff'
          };
        }
      });
    }

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#2196F3',
        selectedTextColor: '#fff'
      };
    }

    return marked;
  };

  if (!availability) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Availability</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowUnavailabilityModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Calendar Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendar Overview</Text>
        <Calendar
          markedDates={getMarkedDates()}
          theme={{
            selectedDayBackgroundColor: '#2196F3',
            todayTextColor: '#2196F3',
            arrowColor: '#2196F3',
          }}
        />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
            <Text style={styles.legendText}>Unavailable (Full Day)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Partially Unavailable</Text>
          </View>
        </View>
      </View>

      {renderWorkingHours()}
      {renderUnavailableDates()}
      {renderUnavailablePeriods()}

      {/* Mark Unavailable Modal */}
      <Modal
        visible={showUnavailabilityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnavailabilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Unavailable</Text>
              <TouchableOpacity onPress={() => setShowUnavailabilityModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Date Selection */}
              <Text style={styles.inputLabel}>Select Date</Text>
              <Calendar
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={selectedDate ? {
                  [selectedDate]: { selected: true, selectedColor: '#2196F3' }
                } : {}}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  selectedDayBackgroundColor: '#2196F3',
                  todayTextColor: '#2196F3',
                  arrowColor: '#2196F3',
                }}
              />

              {/* Unavailability Type */}
              <Text style={styles.inputLabel}>Unavailability Type</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setUnavailabilityType('full_day')}
                >
                  <Ionicons
                    name={unavailabilityType === 'full_day' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#2196F3"
                  />
                  <Text style={styles.radioText}>Full Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setUnavailabilityType('partial')}
                >
                  <Ionicons
                    name={unavailabilityType === 'partial' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#2196F3"
                  />
                  <Text style={styles.radioText}>Partial Day</Text>
                </TouchableOpacity>
              </View>

              {/* Time Selection for Partial */}
              {unavailabilityType === 'partial' && (
                <View style={styles.timeSelection}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="HH:MM"
                    />
                  </View>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="HH:MM"
                    />
                  </View>
                </View>
              )}

              {/* Reason */}
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={3}
                placeholder="Please provide a reason for unavailability..."
                value={reason}
                onChangeText={setReason}
                maxLength={200}
              />

              {/* Affected Appointments */}
              {affectedAppointments.length > 0 && (
                <View style={styles.affectedContainer}>
                  <Text style={styles.affectedTitle}>
                    Affected Appointments ({affectedAppointments.length})
                  </Text>
                  {affectedAppointments.map(apt => (
                    <View key={apt.id} style={styles.affectedAppointment}>
                      <Text style={styles.affectedPatient}>{apt.patientName}</Text>
                      <Text style={styles.affectedTime}>{apt.time}</Text>
                    </View>
                  ))}
                  <Text style={styles.affectedNote}>
                    Reception will be notified to reschedule these appointments
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowUnavailabilityModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleMarkUnavailable}
                >
                  <Text style={styles.confirmButtonText}>Mark Unavailable</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  unavailableText: {
    fontSize: 14,
    color: '#f44336',
    fontStyle: 'italic',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  slotDuration: {
    fontSize: 12,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  unavailableDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
    unavailableDateText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  unavailablePeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodInfo: {
    flex: 1,
  },
  periodDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  periodTime: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
  },
  periodReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  radioText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  timeSelection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    marginHorizontal: 20,
    minHeight: 80,
  },
  affectedContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  affectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8F00',
    marginBottom: 10,
  },
  affectedAppointment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  affectedPatient: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  affectedTime: {
    fontSize: 12,
    color: '#FF8F00',
  },
  affectedNote: {
    fontSize: 12,
    color: '#FF8F00',
    fontStyle: 'italic',
    marginTop: 8,
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
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

