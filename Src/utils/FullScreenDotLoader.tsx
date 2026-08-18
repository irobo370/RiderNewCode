import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Easing } from 'react-native';
import { BlurView } from 'expo-blur';

type Props = {
  visible: boolean;
  text?: string;
};

const FullScreenDotLoader: React.FC<Props> = ({ visible, text = 'Processing...' }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // 🔥 box scale animation (premium feel)
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const animateDot = (dot: Animated.Value, delay: number) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(dot, {
          toValue: -10,
          duration: 300,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
  };

  useEffect(() => {
    if (visible) {
      // dots animation
      Animated.parallel([
        animateDot(dot1, 0),
        animateDot(dot2, 150),
        animateDot(dot3, 300),
      ]).start();

      // 🔥 subtle breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* 🔥 Glass Blur Background */}
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />

      {/* ✅ Animated Box */}
      <Animated.View style={[styles.box, { transform: [{ scale: scaleAnim }] }]}>
        {/* 🔥 Dots */}
        <View style={styles.row}>
          {[dot1, dot2, dot3].map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: anim }] }]} />
          ))}
        </View>

        {/* 🔥 Text */}
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
};

export default FullScreenDotLoader;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // Modern card overlay
  box: {
    width: 200,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',

    alignItems: 'center',

    // soft shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  // 🔥 smoother dots
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#222', // softer than pure black
    marginHorizontal: 6,
  },

  text: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    letterSpacing: 0.3,
  },
});
