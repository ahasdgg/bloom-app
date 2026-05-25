/**
 * Animated Sphere Component
 * Main interactive element for the Seed Screen
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, GestureResponderEvent} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface AnimatedSphereProps {
  onPress: () => void;
  isLoading?: boolean;
  size?: number;
}

const AnimatedSphere: React.FC<AnimatedSphereProps> = ({
  onPress,
  isLoading = false,
  size = 200,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    breathingAnimation.start();

    return () => breathingAnimation.stop();
  }, [scaleAnim]);

  // Rotation animation
  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }),
    );

    rotationAnimation.start();

    return () => rotationAnimation.stop();
  }, [rotateAnim]);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      const loadingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );

      loadingAnimation.start();

      return () => loadingAnimation.stop();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, opacityAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{scale: scaleAnim}],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.sphere,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
      >
        <LinearGradient
          colors={['#d4a574', '#c9a961', '#b8944e']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[
            styles.gradient,
            {
              borderRadius: size / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.innerGradient,
              {
                transform: [{rotate: rotateInterpolate}],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(212, 165, 116, 0.3)', 'rgba(184, 148, 78, 0.1)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[
                styles.gradient,
                {
                  borderRadius: size / 2,
                },
              ]}
            />
          </Animated.View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sphere: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AnimatedSphere;
