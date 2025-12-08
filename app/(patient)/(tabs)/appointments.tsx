import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
// import { useToast } from '../../../components/Toast/ToastContext';
import { AppointmentCardSkeleton } from '../../../components/Skeletons/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import ApiService from '../../../services/api.service';

export default function PatientAppointmentsScreen() {
  const { user } = useUser();
  // const { success, error: showError, info } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const success = (msg: string) => Alert.alert('Success', msg);
  const showError = (msg: string) => Alert.alert('Error', msg);
  const info = (msg: string) => Alert.alert('Info', msg);
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getAppointments();
      
      if (response.success && response.appointments) {
        setAppointments(response.appointments);
      } else {
        throw new Error(response.message || 'Failed to load appointments');
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      showError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filterAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    if (activeTab === 'upcoming') {
      return appointments.filter(apt => {
        const isUpcoming = apt.date > today || (apt.date === today && apt.time > currentTime);
        return isUpcoming && apt.status !== 'cancelled' && apt.status !== 'completed';
      });
    } else if (activeTab === 'past') {
      return appointments.filter(apt => {
        const isPast = apt.date < today || (apt.date === today && apt.time <= currentTime);
        return (isPast && apt.status !== 'cancelled') || apt.status === 'completed';
      });
    } else {
      return appointments.filter(apt => apt.status === 'cancelled');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAppointments();
      success('Appointments refreshed');
    } catch (err) {
      showError('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleReschedule = (appointment) => {
    Alert.alert(
      'Reschedule Appointment',
      `Do you want to reschedule your appointment with ${appointment.doctorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reschedule',
          onPress: () => {
            info('Redirecting to reschedule...');
            router.push({
              pathname: '/(patient)/book-appointment',
              params: { 
                doctorId: appointment.doctorId,
                rescheduleId: appointment.id 
              }
            });
          }
        }
      ]
    );
  };

  const handleCancel = async (appointmentId: number) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.cancelAppointment(appointmentId);
              
              if (response.success) {
                success('Appointment cancelled successfully');
                await loadAppointments();
              } else {
                throw new Error(response.message || 'Failed to cancel appointment');
              }
            } catch (err: any) {
              showError(err.message || 'Failed to cancel appointment');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const renderAppointmentCard = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.appointmentDate}>{item.date} at {item.time}</Text>
          <Text style={styles.appointmentType}>{item.type}</Text>
        </View>
        <View style={styles.appointmentMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.appointmentFee}>₹{item.fee}</Text>
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
          <Ionicons name="calendar-outline" size={16} color="#FF9800" />
          <Text style={styles.rescheduleText}>
            Rescheduled from {item.originalDate}
          </Text>
        </View>
      )}

      {activeTab === 'upcoming' && item.status !== 'cancelled' && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => handleReschedule(item)}
          >
            <Ionicons name="calendar-outline" size={16} color="#FF9800" />
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancel(item.id)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#f44336" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'past' && item.status === 'completed' && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.bookAgainButton]}
            onPress={() => {
              info('Redirecting to book appointment...');
              router.push({
                pathname: '/(patient)/book-appointment',
                params: { doctorId: item.doctorId }
              });
            }}
          >
            <Ionicons name="add-circle-outline" size={16} color="#2196F3" />
            <Text style={styles.bookAgainButtonText}>Book Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    const emptyStates = {
      upcoming: {
        icon: 'calendar-outline',
        title: 'No Upcoming Appointments',
        description: 'Book your first appointment with our experienced doctors',
        actionText: 'Find Doctors',
        action: () => router.push('/(patient)/(tabs)/home')
      },
      past: {
        icon: 'checkmark-circle-outline',
        title: 'No Past Appointments',
        description: 'Your completed appointments will appear here',
        actionText: null,
        action: null
      },
      cancelled: {
        icon: 'close-circle-outline',
        title: 'No Cancelled Appointments',
        description: 'Your cancelled appointments will appear here',
        actionText: null,
        action: null
      }
    };

    const state = emptyStates[activeTab];
    
    return (
      <EmptyState
        icon={state.icon}
        title={state.title}
        description={state.description}
        actionText={state.actionText}
        onAction={state.action}
      />
    );
  };

  const renderSkeletonLoader = () => (
    <View style={styles.listContainer}>
      <AppointmentCardSkeleton />
      <AppointmentCardSkeleton />
      <AppointmentCardSkeleton />
    </View>
  );

  const filteredAppointments = filterAppointments();

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === 'upcoming' || (a.status !== 'cancelled' && a.status !== 'completed')).length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === 'cancelled').length}
          </Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['upcoming', 'past', 'cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointments List */}
      {loading ? (
        renderSkeletonLoader()
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
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
            filteredAppointments.length === 0 && styles.emptyList
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginBottom: 10,
    elevation: 1,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 1,
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
  listContainer: {
    padding: 15,
    flexGrow: 1,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: '#666',
  },
  appointmentMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  appointmentFee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  symptomsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  symptomsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
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
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 5,
    fontWeight: '500',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  rescheduleButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  rescheduleButtonText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bookAgainButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  bookAgainButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});