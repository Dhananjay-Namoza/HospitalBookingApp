import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  email: string;
  type: 'patient' | 'doctor';
  name: string;
  phone: string;
  isPremium?: boolean;
  allergies?: string[];
  diseases?: string[];
  bloodGroup?: string;
  emergencyContact?: string;
  designation?: string;
  category?: string;
  speciality?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  appointments: any[];
  setAppointments: (appointments: any[]) => void;
  chats: any[];
  setChats: (chats: any[]) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userType');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
      setAppointments([]);
      setChats([]);
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const value = {
    user,
    setUser,
    appointments,
    setAppointments,
    chats,
    setChats,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
