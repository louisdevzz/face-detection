import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedView from '../components/AnimatedView';
import useAppStore from '../store/appStore';
import { COLORS, GRADIENTS, FONTS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen = ({ navigation }) => {
  console.log('🎬 SplashScreen: Component mounted');
  
  let isDarkMode = false;
  try {
    isDarkMode = useAppStore((state) => state.isDarkMode);
    console.log('✅ SplashScreen: isDarkMode =', isDarkMode);
  } catch (error) {
    console.error('❌ SplashScreen: Error getting isDarkMode', error);
  }
  
  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    console.log('⏱️ SplashScreen: Setting up timer');
    const timer = setTimeout(() => {
      console.log('⏱️ SplashScreen: Timer fired, navigating to Home');
      try {
        navigation.replace('Home');
      } catch (error) {
        console.error('❌ SplashScreen: Error navigating', error);
      }
    }, 2500);

    return () => {
      console.log('⏱️ SplashScreen: Cleaning up timer');
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <LinearGradient
      colors={GRADIENTS.primary}
      style={styles.container}
    >
      <AnimatedView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.content}
      >
        <Ionicons name="scan-circle" size={100} color="#FFFFFF" />
        <Text style={styles.title}>FaceGate Access</Text>
        <Text style={styles.subtitle}>Thông minh. An toàn. Liền mạch.</Text>
      </AnimatedView>

      <AnimatedView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800, delay: 500 }}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Powered by AI Recognition</Text>
      </AnimatedView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default SplashScreen;

