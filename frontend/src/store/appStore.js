import { create } from 'zustand';
import { Appearance } from 'react-native';

// Initialize theme from system
const getInitialTheme = () => {
  try {
    const colorScheme = Appearance.getColorScheme();
    console.log('🎨 appStore: Initial colorScheme =', colorScheme);
    const isDark = colorScheme === 'dark';
    console.log('🎨 appStore: Initial isDarkMode =', isDark);
    return isDark;
  } catch (error) {
    console.error('❌ appStore: Error getting initial theme', error);
    return false;
  }
};

const useAppStore = create((set) => ({
  // Theme
  isDarkMode: getInitialTheme(),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  // Camera
  cameraType: 'front',
  toggleCamera: () => set((state) => ({ 
    cameraType: state.cameraType === 'front' ? 'back' : 'front' 
  })),
  
  // Face Detection State
  faceDetected: false,
  setFaceDetected: (detected) => set({ faceDetected: detected }),
  
  // Recognition State
  isRecognizing: false,
  setIsRecognizing: (recognizing) => set({ isRecognizing: recognizing }),
  
  recognitionResult: null,
  setRecognitionResult: (result) => set({ recognitionResult: result }),
  
  // Registration State
  registrationImages: [],
  addRegistrationImage: (image) => set((state) => ({
    registrationImages: [...state.registrationImages, image]
  })),
  clearRegistrationImages: () => set({ registrationImages: [] }),
  
  // API Config
  serverUrl: 'http://192.168.1.7:8000', // Backend Flask default in app/main.py
  setServerUrl: (url) => set({ serverUrl: url }),
  
  // Device ID
  deviceId: null,
  setDeviceId: (id) => set({ deviceId: id }),
}));

export default useAppStore;

