import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mockUsers, mockMedicalRecords, mockAppointments } from '../../data/mockData';
import ApiService from './../../services/api.service';
export default function PatientDetailScreen() {
  const { patientId } = useLocalSearchParams();
  const [patient, setPatient] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPatientData();
  }, []);

const loadPatientData = async () => {
  try {
    setLoading(true);
    const patientId = parseInt(params.patientId as string);
    
    // Load patient info and their appointments
    const [appointmentsResponse] = await Promise.all([
      ApiService.getAppointments({ patientId }),
    ]);
    
    if (appointmentsResponse.success) {
      setAppointments(appointmentsResponse.appointments);
    }
  } catch (err) {
    console.error('Error loading patient data:', err);
  } finally {
    setLoading(false);
  }
};

  const handleCall = () => {
    if (patient?.phone) {
      Linking.openURL(`tel:${patient.phone}`);
    }
  };

  const handleChat = () => {
    if (!patient?.isPremium) {
      Alert.alert(
        'Premium Required',
        'This patient needs a premium membership to chat with doctors.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    router.push({
      pathname: '/(doctor)/chat/[id]',
      params: { id: patient.id, type: 'patient' }
    });
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Basic Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#2196F3" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{patient?.name}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#2196F3" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{patient?.email}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#2196F3" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{patient?.phone}</Text>
            </View>
          </View>
          {patient?.dateOfBirth && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{patient.dateOfBirth}</Text>
              </View>
            </View>
          )}
          {patient?.gender && (
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#2196F3" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{patient.gender}</Text>
              </View>
            </View>
          )}
          {patient?.bloodGroup && (
            <View style={styles.infoItem}>
              <Ionicons name="water-outline" size={20} color="#f44336" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Blood Group</Text>
                <Text style={[styles.infoValue, { color: '#f44336', fontWeight: 'bold' }]}>
                  {patient.bloodGroup}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Medical Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        
        {patient?.allergies && patient.allergies.length > 0 && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalHeader}>
              <Ionicons name="warning-outline" size={20} color="#FF9800" />
              <Text style={styles.medicalTitle}>Allergies</Text>
            </View>
            <View style={styles.tagContainer}>
              {patient.allergies.map((allergy, index) => (
                <View key={index} style={[styles.tag, styles.allergyTag]}>
                  <Text style={styles.tagText}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {patient?.diseases && patient.diseases.length > 0 && (
          <View style={styles.medicalItem}>
            <View style={styles.medicalHeader}>
              <Ionicons name="medical-outline" size={20} color="#9C27B0" />
              <Text style={styles.medicalTitle}>Chronic Conditions</Text>
            </View>
            <View style={styles.tagContainer}>
              {patient.diseases.map((disease, index) => (
                <View key={index} style={[styles.tag, styles.diseaseTag]}>
                  <Text style={styles.tagText}>{disease}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {patient?.emergencyContact && (
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#f44336" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>{patient.emergencyContact}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Recent Appointments */}
      {appointments.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Recent Appointments</Text>
          {appointments.slice(0, 3).map((appointment, index) => (
            <View key={index} style={styles.appointmentItem}>
              <View style={styles.appointmentDate}>
                <Text style={styles.appointmentDateText}>{appointment.date}</Text>
                <Text style={styles.appointmentTimeText}>{appointment.time}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentType}>{appointment.type}</Text>
                <Text style={styles.appointmentStatus}>{appointment.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderMedicalTab = () => (
    <View style={styles.tabContent}>
      {medicalRecord ? (
        <>
          {/* Prescriptions */}
          {medicalRecord.prescriptions && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
              {medicalRecord.prescriptions.map((prescription, index) => (
                <View key={index} style={styles.prescriptionCard}>
                  <View style={styles.prescriptionHeader}>
                    <Text style={styles.prescriptionDoctor}>{prescription.doctorName}</Text>
                    <Text style={styles.prescriptionDate}>{prescription.date}</Text>
                  </View>
                  {prescription.medications.map((med, medIndex) => (
                    <View key={medIndex} style={styles.medicationItem}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <Text style={styles.medicationDetails}>
                        {med.dosage} • {med.frequency} • {med.duration}
                      </Text>
                    </View>
                  ))}
                  {prescription.instructions && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>Instructions:</Text>
                      <Text style={styles.instructionsText}>{prescription.instructions}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Test Reports */}
          {medicalRecord.testReports && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Test Reports</Text>
              {medicalRecord.testReports.map((report, index) => (
                <View key={index} style={styles.testReportCard}>
                  <View style={styles.testReportHeader}>
                    <Text style={styles.testName}>{report.testName}</Text>
                    <Text style={styles.testDate}>{report.date}</Text>
                  </View>
                  <View style={styles.testResult}>
                    <Text style={styles.testResultLabel}>Result:</Text>
                    <Text style={[
                      styles.testResultValue,
                      report.result === 'Normal' ? styles.normalResult : styles.abnormalResult
                    ]}>
                      {report.result}
                    </Text>
                  </View>
                  {report.values && (
                    <View style={styles.testValues}>
                      {Object.entries(report.values).map(([key, value]) => (
                        <Text key={key} style={styles.testValueItem}>
                          {key}: {value}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Vital Signs */}
          {medicalRecord.vitalSigns && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Latest Vital Signs</Text>
              {medicalRecord.vitalSigns.map((vital, index) => (
                <View key={index} style={styles.vitalsCard}>
                  <Text style={styles.vitalsDate}>{vital.date}</Text>
                  <View style={styles.vitalsGrid}>
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalLabel}>Blood Pressure</Text>
                      <Text style={styles.vitalValue}>{vital.bloodPressure}</Text>
                    </View>
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalLabel}>Heart Rate</Text>
                      <Text style={styles.vitalValue}>{vital.heartRate} bpm</Text>
                    </View>
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalLabel}>Temperature</Text>
                      <Text style={styles.vitalValue}>{vital.temperature}°F</Text>
                    </View>
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalLabel}>Weight</Text>
                      <Text style={styles.vitalValue}>{vital.weight} kg</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="medical-outline" size={50} color="#ccc" />
          <Text style={styles.noDataTitle}>No Medical Records</Text>
          <Text style={styles.noDataSubtitle}>No medical records available for this patient</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading patient details...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>Patient not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Patient Header */}
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={60} color="#2196F3" />
            {patient.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
              </View>
            )}
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientEmail}>{patient.email}</Text>
            <View style={styles.patientMeta}>
              <Text style={styles.patientAge}>
                {patient.dateOfBirth && `Age: ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}`}
              </Text>
              {patient.bloodGroup && (
                <View style={styles.bloodGroupBadge}>
                  <Text style={styles.bloodGroupText}>{patient.bloodGroup}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              !patient.isPremium && styles.actionButtonDisabled
            ]}
            onPress={handleChat}
            disabled={!patient.isPremium}
          >
            <Ionicons 
              name="chatbubble" 
              size={20} 
              color={patient.isPremium ? "#2196F3" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'medical' && styles.activeTab]}
          onPress={() => setActiveTab('medical')}
        >
          <Text style={[styles.tabText, activeTab === 'medical' && styles.activeTabText]}>
            Medical Records
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? renderOverviewTab() : renderMedicalTab()}
      </ScrollView>
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
  patientHeader: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  bloodGroupBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  bloodGroupText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 1,
  },
  actionButtonDisabled: {
    opacity: 0.5,
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
  content: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 20,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoGrid: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  medicalItem: {
    marginBottom: 20,
  },
  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  allergyTag: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  diseaseTag: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentDate: {
    marginRight: 15,
  },
  appointmentDateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentTimeText: {
    fontSize: 12,
    color: '#666',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  appointmentStatus: {
    fontSize: 12,
    color: '#2196F3',
    textTransform: 'capitalize',
  },
  prescriptionCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  prescriptionDoctor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#666',
  },
  medicationItem: {
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  medicationDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  instructionsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  testReportCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  testReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  testDate: {
    fontSize: 14,
    color: '#666',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testResultLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
    testResultValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  normalResult: {
    color: '#4CAF50',
  },
  abnormalResult: {
    color: '#f44336',
  },
  testValues: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 5,
  },
  testValueItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 3,
  },
  vitalsCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  vitalsDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalItem: {
    width: '48%',
    marginBottom: 10,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
