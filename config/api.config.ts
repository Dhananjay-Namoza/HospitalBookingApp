const API_BASE_URL = 'http://72.60.221.85:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  
  // Doctor endpoints
  DOCTORS: {
    LIST: `${API_BASE_URL}/doctors`,
    DETAIL: (id: number) => `${API_BASE_URL}/doctors/${id}`,
    AVAILABILITY: (id: number) => `${API_BASE_URL}/doctors/${id}/availability`,
    UPDATE_AVAILABILITY: (id: number) => `${API_BASE_URL}/doctors/${id}/availability`,
    MARK_UNAVAILABLE: `${API_BASE_URL}/doctors/unavailable`,
    MY_PATIENTS: `${API_BASE_URL}/doctors/me/patients`,
    PATIENT_BY_ID: (id: number) => `${API_BASE_URL}/doctors/patients/${id}`,
  },
  
  // Appointment endpoints
  APPOINTMENTS: {
    LIST: `${API_BASE_URL}/appointments`,
    CREATE: `${API_BASE_URL}/appointments`,
    DETAIL: (id: number) => `${API_BASE_URL}/appointments/${id}`,
    UPDATE: (id: number) => `${API_BASE_URL}/appointments/${id}`,
    CANCEL: (id: number) => `${API_BASE_URL}/appointments/${id}`,
  },
  
  // Chat endpoints
  CHATS: {
    LIST: `${API_BASE_URL}/chats`,
    CREATE: `${API_BASE_URL}/chats/create`,
    MESSAGES: (id: number) => `${API_BASE_URL}/chats/${id}/messages`,
    SEND_MESSAGE: (id: number) => `${API_BASE_URL}/chats/${id}/messages`,
    MARK_READ: (id: number) => `${API_BASE_URL}/chats/${id}/read`,
    FILE_UPLOAD: `${API_BASE_URL}/chats/files/upload`,
  },
  
  // Patient endpoints
  PATIENTS: {
    MEDICAL_RECORDS: `${API_BASE_URL}/patients/medical-records`,
  },
  
  // Reception endpoints
  RECEPTION: {
    MESSAGES: `${API_BASE_URL}/reception/messages`,
    UPDATE_MESSAGE: (id: number) => `${API_BASE_URL}/reception/messages/${id}`,
    CREATE_DOCTOR: `${API_BASE_URL}/reception/doctors`,
  },
  
  // Health check
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;