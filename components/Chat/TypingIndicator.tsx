// components/Chat/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  userName?: string;
  show?: boolean;
}

export default function TypingIndicator({ 
  userName = 'Someone', 
  show = true 
}: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [show]);

  const startAnimation = () => {
    const duration = 600;
    const delay = 200;

    const createAnimation = (animatedValue: Animated.Value, delayTime: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayTime),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createAnimation(dot1, 0),
      createAnimation(dot2, delay),
      createAnimation(dot3, delay * 2),
    ]).start();
  };

  const stopAnimation = () => {
    dot1.stopAnimation();
    dot2.stopAnimation();
    dot3.stopAnimation();
    dot1.setValue(0);
    dot2.setValue(0);
    dot3.setValue(0);
  };

  if (!show) {
    return null;
  }

  const dotScale = (animatedValue: Animated.Value) => ({
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{userName} is typing</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dotScale(dot1)]} />
          <Animated.View style={[styles.dot, dotScale(dot2)]} />
          <Animated.View style={[styles.dot, dotScale(dot3)]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 8,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
  },
});