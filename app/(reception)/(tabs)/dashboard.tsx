import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../../services/api.service';

export default function ReceptionDashboardScreen() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    pendingMessages: 0,
    todayAppointments: 0,
    completedToday: 0,
    cancelledToday: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [appointmentsResponse, messagesResponse] = await Promise.all([
        ApiService.getAppointments(),
        ApiService.getReceptionMessages({ status: 'pending' })
      ]);

      if (appointmentsResponse.success && appointmentsResponse.appointments) {
        const appointments = appointmentsResponse.appointments;
        const today = new Date().toISOString().split('T')[0];
        
        const todayAppointments = appointments.filter(apt => apt.date === today);
        
        setStats({
          totalAppointments: appointments.length,
          upcomingAppointments: appointments.filter(apt => apt.status === 'upcoming').length,
          pendingMessages: messagesResponse.success ? messagesResponse.messages.length : 0,
          todayAppointments: todayAppointments.length,
          completedToday: todayAppointments.filter(apt => apt.status === 'completed').length,
          cancelledToday: todayAppointments.filter(apt => apt.status === 'cancelled').length
        });

        setRecentAppointments(appointments.slice(0, 5));
      }

      if (messagesResponse.success && messagesResponse.messages) {
        setPendingMessages(messagesResponse.messages.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderQuickAction = (title: string, icon: string, onPress: () => void, color: string) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reception Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage appointments and requests</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {stats.pendingMessages > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{stats.pendingMessages}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Today's Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          {renderStatCard('Total', stats.todayAppointments, 'calendar', '#2196F3')}
          {renderStatCard('Completed', stats.completedToday, 'checkmark-circle', '#4CAF50')}
          {renderStatCard('Cancelled', stats.cancelledToday, 'close-circle', '#f44336')}
        </View>
      </View>

      {/* Overall Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        <View style={styles.statsGrid}>
          {renderStatCard('All Appointments', stats.totalAppointments, 'list', '#9C27B0')}
          {renderStatCard('Upcoming', stats.upcomingAppointments, 'time', '#FF9800')}
          {renderStatCard('Pending Messages', stats.pendingMessages, 'mail', '#F44336')}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {renderQuickAction('View All Appointments', 'calendar', () => router.push('/(reception)/(tabs)/appointments'), '#2196F3')}
          {renderQuickAction('Pending Messages', 'mail', () => router.push('/(reception)/(tabs)/messages'), '#FF9800')}
          {renderQuickAction('Add Doctor', 'person-add', () => router.push('/(reception)/(tabs)/doctors'), '#4CAF50')}
          {renderQuickAction('Reports', 'stats-chart', () => Alert.alert('Coming Soon', 'Reports feature will be available soon!'), '#9C27B0')}
        </View>
      </View>

      {/* Recent Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Appointments</Text>
          <TouchableOpacity onPress={() => router.push('/(reception)/(tabs)/appointments')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentAppointments.length > 0 ? (
          recentAppointments.map((appointment: any) => (
            <View key={appointment.id} style={styles.appointmentItem}>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentPatient}>{appointment.patientName}</Text>
                <Text style={styles.appointmentDetails}>
                  Dr. {appointment.doctorName} • {appointment.date} at {appointment.time}
                </Text>
              </View>
              <View style={[styles.appointmentStatus, { backgroundColor: getStatusColor(appointment.status) }]}>
                <Text style={styles.appointmentStatusText}>{appointment.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent appointments</Text>
        )}
      </View>

      {/* Pending Messages */}
      {pendingMessages.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Messages</Text>
            <TouchableOpacity onPress={() => router.push('/(reception)/(tabs)/messages')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {pendingMessages.map((message: any) => (
            <View key={message.id} style={styles.messageItem}>
              <View style={styles.messageIcon}>
                <Ionicons name="medical" size={20} color="#FF9800" />
              </View>
              <View style={styles.messageContent}>
                <Text style={styles.messageDoctorName}>{message.doctorName}</Text>
                <Text style={styles.messageText} numberOfLines={2}>{message.message}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    flexDirection: 'column',
    borderRadius: 12,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  statsGrid: {
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentPatient: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDetails: {
    fontSize: 13,
    color: '#666',
  },
  appointmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageDoctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});