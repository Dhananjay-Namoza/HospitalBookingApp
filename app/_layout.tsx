import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../context/UserContext';
import { AppointmentProvider } from '../context/AppointmentContext';
import { LogBox } from 'react-native';

// Suppress development warnings for demo
if (__DEV__) {
  LogBox.ignoreAllLogs(true);
  LogBox.ignoreLogs([
    'Warning: ...',
    'Remote debugger',
    'Require cycle',
    'VirtualizedList',
    'componentWillReceiveProps',
    'componentWillMount',
    'Setting a timer',
    'Animated.event',
    'Task orphaned',
    'Module RCTImageLoader',
    'Non-serializable values',
    'Found screens with the same name',
  ]);
}

export default function RootLayout() {
  return (
    <UserProvider>
      <AppointmentProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(patient)" options={{ headerShown: false }} />
          <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
          <Stack.Screen name="(reception)" options={{ headerShown: false }} />
        </Stack>
      </AppointmentProvider>
    </UserProvider>
  );
}
