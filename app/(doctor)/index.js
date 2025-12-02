import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useUser } from '../../context/UserContext';
import { mockAppointments, mockDoctorAvailability } from '../../data/mockData';

export default function DoctorHomeScreen() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    calculateTodayStats();
  }, [appointments]);

  const loadAppointments = () => {
    const doctorAppointments = mockAppointments.filter(apt => apt.doctorId === user?.id);
    setAppointments(doctorAppointments);
  };

  const calculateTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.date === today);
    
    setTodayStats({
      total: todayAppointments.length,
      completed: todayAppointments.filter(apt => apt.status === 'completed').length,
      upcoming: todayAppointments.filter(apt => apt.status === 'upcoming').length,
      cancelled: todayAppointments.filter(apt => apt.status === 'cancelled').length
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      loadAppointments();
      setRefreshing(false);
    }, 1000);
  };

  const getMarkedDates = () => {
    const marked = {};
    const availability = mockDoctorAvailability[user?.id];
    
    // Mark appointment dates
    appointments.forEach(apt => {
      if (!marked[apt.date]) {
        marked[apt.date] = { dots: [] };
      }
      
      const color = apt.status === 'completed' ? '#4CAF50' : 
                   apt.status === 'upcoming' ? '#2196F3' : '#f44336';
      
      marked[apt.date].dots.push({ color });
    });

    // Mark unavailable dates
    if (availability) {
      availability.unavailableDates.forEach(date => {
        if (!marked[date]) {
          marked[date] = {};
        }
        marked[date].disabled = true;
        marked[date].disableTouchEvent = true;
        marked[date].selectedColor = '#f44336';
        marked[date].selectedTextColor = '#fff';
      });

      // Mark partially unavailable dates
      availability.unavailablePeriods.forEach(period => {
        if (!marked[period.date]) {
          marked[period.date] = { dots: [] };
        }
        marked[period.date].dots.push({ color: '#FF9800' });
      });
    }

    // Mark selected date
    if (selectedDate) {
      if (!marked[selectedDate]) {
        marked[selectedDate] = {};
      }
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#2196F3';
    }

    return marked;
  };

  const getSelectedDateAppointments = () => {
    return appointments.filter(apt => apt.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const renderAppointmentCard = (appointment) => (
    <TouchableOpacity
      key={appointment.id}
      style={[
        styles.appointmentCard,
        { borderLeftColor: getStatusColor(appointment.status) }
      ]}
      onPress={() => router.push({
        pathname: '/(doctor)/patient-detail',
        params: { patientId: appointment.patientId, appointmentId: appointment.id }
      })}
    >
      <View style={styles.appointmentTime}>
        <Text style={styles.timeText}>{appointment.time}</Text>
        <Text style={styles.durationText}>30min</Text>
      </View>
      
      <View style={styles.appointmentDetails}>
        <Text style={styles.patientName}>{appointment.patientName}</Text>
        <Text style={styles.appointmentType}>{appointment.type}</Text>
        <Text style={styles.symptoms} numberOfLines={2}>{appointment.symptoms}</Text>
      </View>
      
      <View style={styles.appointmentStatus}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
          {appointment.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      case 'rescheduled': return '#FF9800';
      default: return '#666';
    }
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(doctor)/manage-availability')}
        >
          <Ionicons name="calendar-outline" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Manage Availability</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(doctor)/(tabs)/appointments')}
        >
          <Ionicons name="list-outline" size={24} color="#4CAF50" />
          <Text style={styles.actionText}>All Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(doctor)/(tabs)/chats')}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#FF9800" />
          <Text style={styles.actionText}>Patient Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(doctor)/(tabs)/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#9C27B0" />
          <Text style={styles.actionText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2196F3']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.doctorName}>Dr. {user?.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
            <Text style={styles.statNumber}>{todayStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
            <Text style={styles.statNumber}>{todayStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
            <Text style={styles.statNumber}>{todayStats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#f44336' }]}>
            <Text style={styles.statNumber}>{todayStats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Appointment Calendar</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={getMarkedDates()}
          markingType={'multi-dot'}
          theme={{
            selectedDayBackgroundColor: '#2196F3',
            todayTextColor: '#2196F3',
            arrowColor: '#2196F3',
            monthTextColor: '#333',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Upcoming</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
            <Text style={styles.legendText}>Cancelled</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>
      </View>

      {/* Selected Date Appointments */}
      <View style={styles.selectedDateContainer}>
        <Text style={styles.sectionTitle}>
          Appointments for {selectedDate}
        </Text>
        {getSelectedDateAppointments().length > 0 ? (
          getSelectedDateAppointments().map(renderAppointmentCard)
        ) : (
          <View style={styles.noAppointmentsContainer}>
            <Ionicons name="calendar-outline" size={40} color="#ccc" />
            <Text style={styles.noAppointmentsText}>No appointments for this date</Text>
          </View>
        )}
      </View>

      {renderQuickActions()}
    </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 2,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  selectedDateContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  appointmentTime: {
    width: 80,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  durationText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  appointmentDetails: {
    flex: 1,
    marginLeft: 15,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 4,
  },
  symptoms: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  appointmentStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  noAppointmentsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});
