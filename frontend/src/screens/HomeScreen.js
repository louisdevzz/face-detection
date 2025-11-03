import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedView from '../components/AnimatedView';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../store/appStore';
import { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';
import { verifyFace } from '../utils/api';

const { width, height } = Dimensions.get('window');
const CAMERA_SIZE = width * 0.7;

const HomeScreen = ({ navigation }) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const cameraType = useAppStore((state) => state.cameraType);
  const serverUrl = useAppStore((state) => state.serverUrl);
  const setIsRecognizing = useAppStore((state) => state.setIsRecognizing);
  const setRecognitionResult = useAppStore((state) => state.setRecognitionResult);
  
  const colors = isDarkMode ? COLORS.dark : COLORS.light;
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  const captureAndVerify = useCallback(async () => {
    if (!cameraRef.current || isProcessing || !cameraReady) {
      console.log('⏸️ HomeScreen: Skipping capture - camera not ready or processing');
      return;
    }

    try {
      setIsProcessing(true);
      setIsRecognizing(true);
      setResult(null);

      console.log('📸 HomeScreen: Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });

      console.log('📸 HomeScreen: Photo captured:', photo.uri);

      // Gọi API để xác thực khuôn mặt (Flask: /recognize)
      console.log('🔍 HomeScreen: Calling verifyFace API...');
      const response = await verifyFace(photo.uri, serverUrl);
      console.log('✅ HomeScreen: API response:', response);

      // Chuẩn hóa kết quả cho UI hiện có
      const uiResult = response?.recognized
        ? {
            success: true,
            name: response?.user?.profile?.name || response?.user?.name || 'User',
            message: 'Cửa đã được mở',
          }
        : {
            success: false,
            message: response?.message || 'Không nhận diện được khuôn mặt',
          };

      setResult(uiResult);
      setRecognitionResult(uiResult);

      // Hiển thị kết quả trong 3 giây
      setTimeout(() => {
        setResult(null);
        setRecognitionResult(null);
      }, 3000);

    } catch (error) {
      const errorMessage = error.message || 'Không thể xác thực khuôn mặt. Vui lòng thử lại.';
      Alert.alert(
        'Lỗi xác thực',
        errorMessage,
        [{ text: 'OK' }]
      );
      // Hiển thị kết quả lỗi trên UI
      setResult({
        success: false,
        message: errorMessage,
      });
      setTimeout(() => {
        setResult(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
      setIsRecognizing(false);
    }
  }, [isProcessing, cameraReady, serverUrl, setIsRecognizing, setRecognitionResult]);

  // Tự động chụp mỗi 5 giây
  useEffect(() => {
    if (!permission?.granted || !cameraReady) {
      console.log('⏸️ HomeScreen: Auto-capture disabled - permission or camera not ready');
      return;
    }

    console.log('✅ HomeScreen: Auto-capture enabled - will capture every 5 seconds');
    const interval = setInterval(() => {
      if (!isProcessing && !result) {
        console.log('🔄 HomeScreen: Auto-capture triggered');
        captureAndVerify();
      }
    }, 5000); // Chụp mỗi 5 giây

    return () => {
      console.log('🛑 HomeScreen: Auto-capture disabled');
      clearInterval(interval);
    };
  }, [permission, cameraReady, isProcessing, result, captureAndVerify]);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Đang kiểm tra quyền camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Ứng dụng cần quyền truy cập camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.gradientButton}
          >
            <Text style={styles.permissionButtonText}>Cấp quyền Camera</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          FaceGate Access
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <AnimatedView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <View
            style={[
              styles.cameraWrapper,
              {
                borderColor: result?.success ? COLORS.light.success : 
                           result?.success === false ? COLORS.light.error :
                           isProcessing ? colors.primary : colors.border,
                shadowColor: result?.success ? COLORS.light.success : 
                           result?.success === false ? COLORS.light.error :
                           isProcessing ? colors.primary : 'transparent',
              },
            ]}
          >
            {cameraError && Platform.OS === 'web' ? (
              <View style={[styles.camera, styles.cameraErrorContainer]}>
                <Ionicons name="camera-outline" size={60} color={colors.textSecondary} />
                <Text style={[styles.cameraErrorText, { color: colors.textSecondary }]}>
                  Camera không khả dụng trên web
                </Text>
                <Text style={[styles.cameraErrorSubtext, { color: colors.textSecondary }]}>
                  Vui lòng test trên thiết bị di động
                </Text>
              </View>
            ) : (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
                onCameraReady={() => {
                  console.log('📷 HomeScreen: Camera is ready');
                  setCameraReady(true);
                  setCameraError(null);
                }}
                onMountError={(error) => {
                  console.log('❌ HomeScreen: Camera error:', error);
                  setCameraReady(false);
                  setCameraError(error);
                }}
              />
            )}
            
            {/* Processing Overlay */}
            {isProcessing && !result && (
              <AnimatedView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.detectionOverlay}
              >
                <LinearGradient
                  colors={[...GRADIENTS.glow, 'transparent']}
                  style={styles.glowBorder}
                />
              </AnimatedView>
            )}
          </View>
        </AnimatedView>

        {/* Instruction Text */}
        <AnimatedView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
        >
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            {result ? '' : 
             isProcessing ? 'Đang nhận diện...' : 
             'Camera đang tự động chụp mỗi 5 giây'}
          </Text>
        </AnimatedView>
      </View>

      {/* Result Display */}
      {result && (
        <AnimatedView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.resultContainer}
        >
          <LinearGradient
            colors={result.success ? GRADIENTS.success : GRADIENTS.error}
            style={styles.resultCard}
          >
            <Ionicons
              name={result.success ? 'checkmark-circle' : 'close-circle'}
              size={60}
              color="#FFFFFF"
            />
            <Text style={styles.resultTitle}>
              {result.success ? '✅ Cho phép truy cập' : '❌ Từ chối truy cập'}
            </Text>
            {result.success && result.name && (
              <Text style={styles.resultName}>Xin chào, {result.name}!</Text>
            )}
            <Text style={styles.resultMessage}>
              {result.success ? 'Cửa đã được mở' : 'Không nhận diện được khuôn mặt'}
            </Text>
          </LinearGradient>
        </AnimatedView>
      )}

      {/* Manual Trigger Button (for testing) */}
      <TouchableOpacity
        style={styles.manualTrigger}
        onPress={() => !isProcessing && captureAndVerify()}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.triggerGradient}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.triggerText}>
            Chụp ngay
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Register FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Registration')}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.fabGradient}
        >
          <Ionicons name="person-add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: SPACING.sm,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: CAMERA_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 4,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cameraErrorText: {
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  cameraErrorSubtext: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  detectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  instructionText: {
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 150,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  resultCard: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  resultName: {
    fontSize: FONTS.sizes.lg,
    color: '#FFFFFF',
    marginTop: SPACING.sm,
  },
  resultMessage: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.xs,
  },
  manualTrigger: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
  },
  triggerGradient: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  triggerText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  permissionText: {
    fontSize: FONTS.sizes.lg,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  permissionButton: {
    marginTop: SPACING.md,
  },
  gradientButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});

export default HomeScreen;

