import React, { useEffect } from 'react';
import { StatusBar, Appearance } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ErrorBoundary from './src/components/ErrorBoundary';
import useAppStore from './src/store/appStore';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  console.log('📱 AppContent: Component mounted');
  
  let isDarkMode = false;
  try {
    isDarkMode = useAppStore((state) => state.isDarkMode);
    console.log('✅ AppContent: isDarkMode =', isDarkMode);
  } catch (error) {
    console.error('❌ AppContent: Error getting isDarkMode', error);
    isDarkMode = false;
  }

  // Listen to system theme changes
  useEffect(() => {
    console.log('🎨 AppContent: Setting up theme listener');
    try {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // Auto update theme based on system preference
        // You can uncomment this if you want auto theme switching
        // useAppStore.setState({ isDarkMode: colorScheme === 'dark' });
      });

      return () => {
        console.log('🎨 AppContent: Removing theme listener');
        subscription.remove();
      };
    } catch (error) {
      console.error('❌ AppContent: Error setting up theme listener', error);
    }
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
            },
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="Registration"
            component={RegistrationScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  console.log('🚀 App.js: Component mounted');
  
  try {
    return (
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ App.js: Error in render', error);
    throw error;
  }
}
