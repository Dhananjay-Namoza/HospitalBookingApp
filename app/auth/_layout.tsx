import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2196F3' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ title: 'Sign Up' }} 
      />
      <Stack.Screen 
        name="otp-verification" 
        options={{ title: 'Verify OTP' }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ title: 'Reset Password' }} 
      />
    </Stack>
  );
}
