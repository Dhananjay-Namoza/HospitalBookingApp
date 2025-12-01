import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../utils/storage';
import { mockAppointments, mockDoctorAvailability, mockUnavailabilityMessages } from '../data/mockData';

interface AppointmentContextType {
  appointments: any[];
  setAppointments: (appointments: any[]) => void;
  addAppointment: (appointment: any) => Promise<boolean>;
  updateAppointment: (id: number, updates: any) => Promise<boolean>;
  deleteAppointment: (id: number) => Promise<boolean>;
  getAppointmentsByPatient: (patientId: number) => any[];
  getAppointmentsByDoctor: (doctorId: number) => any[];
  unavailabilityMessages: any[];
  addUnavailabilityMessage: (message: any) => Promise<boolean>;
  updateUnavailabilityMessage: (id: number, updates: any) => Promise<boolean>;
  doctorAvailability: any;
  updateDoctorAvailability: (doctorId: number, availability: any) => Promise<boolean>;
  loadData: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider = ({ children }: { children: React.ReactNode }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [unavailabilityMessages, setUnavailabilityMessages] = useState<any[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<any>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Load from storage
      let storedAppointments = await StorageService.getAppointments();
      let storedMessages = await StorageService.getUnavailabilityMessages();
      let storedAvailability = await StorageService.getDoctorAvailability();

      // If no data in storage, initialize with mock data
      if (storedAppointments.length === 0) {
        storedAppointments = mockAppointments;
        await StorageService.saveAppointments(storedAppointments);
      }

      if (storedMessages.length === 0) {
        storedMessages = mockUnavailabilityMessages;
        await StorageService.saveUnavailabilityMessages(storedMessages);
      }

      if (Object.keys(storedAvailability).length === 0) {
        storedAvailability = mockDoctorAvailability;
        await StorageService.saveDoctorAvailability(storedAvailability);
      }

      setAppointments(storedAppointments);
      setUnavailabilityMessages(storedMessages);
      setDoctorAvailability(storedAvailability);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error initializing data:', error);
      // Fallback to mock data
      setAppointments(mockAppointments);
      setUnavailabilityMessages(mockUnavailabilityMessages);
      setDoctorAvailability(mockDoctorAvailability);
      setIsLoaded(true);
    }
  };

  const loadData = async () => {
    const storedAppointments = await StorageService.getAppointments();
    const storedMessages = await StorageService.getUnavailabilityMessages();
    const storedAvailability = await StorageService.getDoctorAvailability();
    
    setAppointments(storedAppointments);
    setUnavailabilityMessages(storedMessages);
    setDoctorAvailability(storedAvailability);
  };

  const addAppointment = async (appointment: any) => {
    try {
      const newAppointment = {
        ...appointment,
        id: Date.now() + Math.random(), // Ensure unique ID
      };
      const updatedAppointments = [...appointments, newAppointment];
      setAppointments(updatedAppointments);
      await StorageService.saveAppointments(updatedAppointments);
      return true;
    } catch (error) {
      console.error('Error adding appointment:', error);
      return false;
    }
  };

  const updateAppointment = async (id: number, updates: any) => {
    try {
      const updatedAppointments = appointments.map(apt =>
        apt.id === id ? { ...apt, ...updates } : apt
      );
      setAppointments(updatedAppointments);
      await StorageService.saveAppointments(updatedAppointments);
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return false;
    }
  };

  const deleteAppointment = async (id: number) => {
    try {
      const updatedAppointments = appointments.filter(apt => apt.id !== id);
      setAppointments(updatedAppointments);
      await StorageService.saveAppointments(updatedAppointments);
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  };

  const getAppointmentsByPatient = (patientId: number) => {
    return appointments.filter(apt => apt.patientId === patientId);
  };

  const getAppointmentsByDoctor = (doctorId: number) => {
    return appointments.filter(apt => apt.doctorId === doctorId);
  };

  const addUnavailabilityMessage = async (message: any) => {
    try {
      const newMessage = {
        ...message,
        id: Date.now() + Math.random(),
      };
      const updatedMessages = [...unavailabilityMessages, newMessage];
      setUnavailabilityMessages(updatedMessages);
      await StorageService.saveUnavailabilityMessages(updatedMessages);
      return true;
    } catch (error) {
      console.error('Error adding unavailability message:', error);
      return false;
    }
  };

  const updateUnavailabilityMessage = async (id: number, updates: any) => {
    try {
      const updatedMessages = unavailabilityMessages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      );
      setUnavailabilityMessages(updatedMessages);
      await StorageService.saveUnavailabilityMessages(updatedMessages);
      return true;
    } catch (error) {
      console.error('Error updating unavailability message:', error);
      return false;
    }
  };

  const updateDoctorAvailability = async (doctorId: number, availability: any) => {
    try {
      const updatedAvailability = {
        ...doctorAvailability,
        [doctorId]: availability,
      };
      setDoctorAvailability(updatedAvailability);
      await StorageService.saveDoctorAvailability(updatedAvailability);
      return true;
    } catch (error) {
      console.error('Error updating doctor availability:', error);
      return false;
    }
  };

  const value = {
    appointments,
    setAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByPatient,
    getAppointmentsByDoctor,
    unavailabilityMessages,
    addUnavailabilityMessage,
    updateUnavailabilityMessage,
    doctorAvailability,
    updateDoctorAvailability,
    loadData,
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  return context;
};
