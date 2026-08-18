import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

const FullScreenLoader = ({ visible, text = 'Processing...' }) => {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* 🔥 Blur Background */}
      <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />

      {/* Loader Content */}
      <View style={styles.dimLayer} />

      <View style={styles.center}>
        <View style={styles.loaderWrapper}>
          <Animated.View style={[styles.circle, { transform: [{ scale }], opacity }]} />
          <View style={styles.innerCircle} />
        </View>

        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};

export default FullScreenLoader;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)', // 20% dark overlay
  },
  center: {
    alignItems: 'center',
  },
  loaderWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
});
