import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  APPOINTMENTS: '@appointments',
  UNAVAILABILITY_MESSAGES: '@unavailability_messages',
  DOCTOR_AVAILABILITY: '@doctor_availability',
};

export const StorageService = {
  // Appointments
  async getAppointments() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  },

  async saveAppointments(appointments: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      return true;
    } catch (error) {
      console.error('Error saving appointments:', error);
      return false;
    }
  },

  async addAppointment(appointment: any) {
    try {
      const appointments = await this.getAppointments();
      appointments.push(appointment);
      await this.saveAppointments(appointments);
      return true;
    } catch (error) {
      console.error('Error adding appointment:', error);
      return false;
    }
  },

  async updateAppointment(appointmentId: number, updates: any) {
    try {
      const appointments = await this.getAppointments();
      const index = appointments.findIndex((apt: any) => apt.id === appointmentId);
      if (index !== -1) {
        appointments[index] = { ...appointments[index], ...updates };
        await this.saveAppointments(appointments);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return false;
    }
  },

  // Unavailability Messages
  async getUnavailabilityMessages() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.UNAVAILABILITY_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting unavailability messages:', error);
      return [];
    }
  },

  async saveUnavailabilityMessages(messages: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.UNAVAILABILITY_MESSAGES, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Error saving unavailability messages:', error);
      return false;
    }
  },

  async addUnavailabilityMessage(message: any) {
    try {
      const messages = await this.getUnavailabilityMessages();
      messages.push(message);
      await this.saveUnavailabilityMessages(messages);
      return true;
    } catch (error) {
      console.error('Error adding unavailability message:', error);
      return false;
    }
  },

  // Doctor Availability
  async getDoctorAvailability() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DOCTOR_AVAILABILITY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting doctor availability:', error);
      return {};
    }
  },

  async saveDoctorAvailability(availability: any) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCTOR_AVAILABILITY, JSON.stringify(availability));
      return true;
    } catch (error) {
      console.error('Error saving doctor availability:', error);
      return false;
    }
  },

  // Clear all data (for testing)
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.APPOINTMENTS,
        STORAGE_KEYS.UNAVAILABILITY_MESSAGES,
        STORAGE_KEYS.DOCTOR_AVAILABILITY,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};