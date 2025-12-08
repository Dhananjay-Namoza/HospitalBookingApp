import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const DoctorCardSkeleton: React.FC = () => (
  <View style={styles.doctorCard}>
    <SkeletonLoader width={70} height={70} borderRadius={35} style={styles.avatar} />
    <View style={styles.doctorInfo}>
      <SkeletonLoader width="60%" height={16} style={styles.mb8} />
      <SkeletonLoader width="40%" height={14} style={styles.mb8} />
      <SkeletonLoader width="50%" height={12} style={styles.mb8} />
      <SkeletonLoader width="30%" height={12} />
    </View>
    <View style={styles.feeContainer}>
      <SkeletonLoader width={60} height={16} style={styles.mb8} />
      <SkeletonLoader width={50} height={30} borderRadius={15} />
    </View>
  </View>
);

export const AppointmentCardSkeleton: React.FC = () => (
  <View style={styles.appointmentCard}>
    <View style={styles.appointmentHeader}>
      <View style={styles.flex1}>
        <SkeletonLoader width="70%" height={16} style={styles.mb8} />
        <SkeletonLoader width="50%" height={14} style={styles.mb8} />
        <SkeletonLoader width="40%" height={12} />
      </View>
      <SkeletonLoader width={60} height={24} borderRadius={12} />
    </View>
  </View>
);

export const ChatItemSkeleton: React.FC = () => (
  <View style={styles.chatItem}>
    <SkeletonLoader width={50} height={50} borderRadius={25} style={styles.mr15} />
    <View style={styles.flex1}>
      <View style={styles.chatHeader}>
        <SkeletonLoader width="40%" height={16} style={styles.mb8} />
        <SkeletonLoader width={50} height={12} />
      </View>
      <SkeletonLoader width="80%" height={14} />
    </View>
  </View>
);

export const PatientCardSkeleton: React.FC = () => (
  <View style={styles.patientCard}>
    <View style={styles.patientHeader}>
      <SkeletonLoader width={50} height={50} borderRadius={25} style={styles.mr15} />
      <View style={styles.flex1}>
        <SkeletonLoader width="60%" height={18} style={styles.mb8} />
        <SkeletonLoader width="80%" height={14} style={styles.mb6} />
        <SkeletonLoader width="70%" height={14} />
      </View>
    </View>
    <View style={styles.patientActions}>
      <SkeletonLoader width="48%" height={40} borderRadius={8} />
      <SkeletonLoader width="48%" height={40} borderRadius={8} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  avatar: {
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  feeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chatItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  flex1: {
    flex: 1,
  },
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
  mr15: {
    marginRight: 15,
  },
});