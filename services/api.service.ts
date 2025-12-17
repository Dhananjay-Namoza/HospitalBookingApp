import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '../config/api.config';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('userToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getHeaders(includeAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    url: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<T> {
    try {
      const headers = await this.getHeaders(includeAuth);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth APIs
  async register(userData: any) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);
  }

  async login(email: string, password: string) {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  }

  async getProfile() {
    return this.request(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
    });
  }

  async updateProfile(updates: any) {
    return this.request(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Doctor APIs
  async getDoctors() {
    return this.request(API_ENDPOINTS.DOCTORS.LIST, {
      method: 'GET',
    }, false);
  }

  async getDoctorById(id: number) {
    return this.request(API_ENDPOINTS.DOCTORS.DETAIL(id), {
      method: 'GET',
    }, false);
  }
  async getPatientById(id: number) {
    return this.request(API_ENDPOINTS.DOCTORS.PATIENT_BY_ID(id), {
      method: 'GET',
    });
  }
  async getDoctorAvailability(id: number) {
    return this.request(API_ENDPOINTS.DOCTORS.AVAILABILITY(id), {
      method: 'GET',
    }, false);
  }

  async updateDoctorAvailability(id: number, availability: any) {
    return this.request(API_ENDPOINTS.DOCTORS.UPDATE_AVAILABILITY(id), {
      method: 'PUT',
      body: JSON.stringify(availability),
    });
  }

  async markDoctorUnavailable(unavailabilityData: any) {
    return this.request(API_ENDPOINTS.DOCTORS.MARK_UNAVAILABLE, {
      method: 'POST',
      body: JSON.stringify(unavailabilityData),
    });
  }

  async getDoctorPatients() {
    return this.request(API_ENDPOINTS.DOCTORS.MY_PATIENTS, {
      method: 'GET',
    });
  }

  // Appointment APIs
  async getAppointments(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`${API_ENDPOINTS.APPOINTMENTS.LIST}${queryString}`, {
      method: 'GET',
    });
  }

  async createAppointment(appointmentData: any) {
    return this.request(API_ENDPOINTS.APPOINTMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getAppointmentById(id: number) {
    return this.request(API_ENDPOINTS.APPOINTMENTS.DETAIL(id), {
      method: 'GET',
    });
  }

  async updateAppointment(id: number, updates: any) {
    return this.request(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async cancelAppointment(id: number) {
    return this.request(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), {
      method: 'DELETE',
    });
  }

  // Chat APIs
  async getChats() {
    return this.request(API_ENDPOINTS.CHATS.LIST, {
      method: 'GET',
    });
  }

  async createChat(chatData: any) {
    return this.request(API_ENDPOINTS.CHATS.CREATE, {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async getChatMessages(chatId: string) {
    return this.request(API_ENDPOINTS.CHATS.MESSAGES(chatId), {
      method: 'GET',
    });
  }

  async sendMessage(chatId: number, message: string) {
    return this.request(API_ENDPOINTS.CHATS.SEND_MESSAGE(chatId), {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async markChatAsRead(chatId: number) {
    return this.request(API_ENDPOINTS.CHATS.MARK_READ(chatId), {
      method: 'PUT',
    });
  }

  // Patient APIs
  async getMedicalRecords() {
    return this.request(API_ENDPOINTS.PATIENTS.MEDICAL_RECORDS, {
      method: 'GET',
    });
  }

  // Reception APIs
  async getReceptionMessages(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`${API_ENDPOINTS.RECEPTION.MESSAGES}${queryString}`, {
      method: 'GET',
    });
  }

  async updateReceptionMessage(id: number, updates: any) {
    return this.request(API_ENDPOINTS.RECEPTION.UPDATE_MESSAGE(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async createDoctor(doctorData: any) {
    return this.request(API_ENDPOINTS.RECEPTION.CREATE_DOCTOR, {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  // Health check
  async healthCheck() {
    return this.request(API_ENDPOINTS.HEALTH, {
      method: 'GET',
    }, false);
  }
}

export default new ApiService();