import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="doctor-detail" 
        options={{ 
          headerShown: true,
          title: 'Doctor Details',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="book-appointment" 
        options={{ 
          headerShown: true,
          title: 'Book Appointment',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff'
        }} 
      />
      <Stack.Screen 
        name="chat/[id]" 
        options={{ 
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff'
        }} 
      />
    </Stack>
  );
}
