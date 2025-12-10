import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const userToken = await SecureStore.getItemAsync('userToken');
      const userType = await SecureStore.getItemAsync('userType');
      
      setTimeout(() => {
        if (userToken) {
          if (userType === 'patient') {
            router.replace('/(patient)/(tabs)/home');
          } else if (userType === 'doctor') {
            router.replace('/(doctor)/(tabs)/patients');
          }else if (userType === 'reception') {
            router.replace('/(reception)/(tabs)/dashboard');
        } else {
          router.replace('/auth/login');
        }
      }
      }, 3000);
    } catch (error) {
      console.log('Auth check error:', error);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>MedCare</Text>
      <Text style={styles.subtitle}>Your Health, Our Priority</Text>
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    marginBottom: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    opacity: 0.7,
  },
});
