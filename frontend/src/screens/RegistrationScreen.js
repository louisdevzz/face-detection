import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedView from '../components/AnimatedView';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../store/appStore';
import { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';
import { registerFace } from '../utils/api';

const { width } = Dimensions.get('window');
const CAMERA_SIZE = width * 0.6;

const CAPTURE_STEPS = [
  { id: 1, label: 'Chính diện', icon: 'person', instruction: 'Nhìn thẳng vào camera' },
  { id: 2, label: 'Nghiêng trái', icon: 'arrow-back', instruction: 'Xoay mặt sang trái 45°' },
  { id: 3, label: 'Nghiêng phải', icon: 'arrow-forward', instruction: 'Xoay mặt sang phải 45°' },
];

const RegistrationScreen = ({ navigation }) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const cameraType = useAppStore((state) => state.cameraType);
  const serverUrl = useAppStore((state) => state.serverUrl);
  
  const colors = isDarkMode ? COLORS.dark : COLORS.light;
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [userClass, setUserClass] = useState('');
  const [room, setRoom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const cameraRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const startCountdown = async () => {
    // Disabled auto-countdown: capture immediately
    if (!permission?.granted) {
      await requestPermission();
      if (!permission?.granted) {
        Alert.alert('Thiếu quyền', 'Cần cấp quyền camera để chụp ảnh.');
        return;
      }
    }
    if (!cameraReady || !cameraRef.current) {
      Alert.alert('Camera chưa sẵn sàng', 'Vui lòng đợi camera khởi tạo xong.');
      return;
    }
    await captureImage();
  };

  const captureImage = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Camera chưa sẵn sàng', 'Vui lòng thử lại sau giây lát.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: Platform.OS === 'web',
        skipProcessing: true,
      });

      // Normalize to compressed JPEG file and save to cache
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: Platform.OS === 'web' }
      );

      let savedUri = manipulated.uri;
      // Ensure file path with .jpg on web by writing base64 to cache
      if (Platform.OS === 'web') {
        const base64Data = manipulated.base64 || photo.base64;
        if (!base64Data) {
          Alert.alert('Lỗi', 'Không thể xử lý ảnh trên web.');
          return;
        }
        const filename = `reg_${Date.now()}.jpg`;
        const dest = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(dest, base64Data, { encoding: FileSystem.EncodingType.Base64 });
        savedUri = dest;
      }

      const newImages = [...capturedImages, savedUri];
      setCapturedImages(newImages);

      if (currentStep < CAPTURE_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Cleanup timer khi unmount hoặc countdown thay đổi
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const retakePhoto = (index) => {
    const newImages = [...capturedImages];
    newImages.splice(index, 1);
    setCapturedImages(newImages);
    if (currentStep >= CAPTURE_STEPS.length - 1) {
      setCurrentStep(index);
    }
  };

  const handleSubmit = async () => {
    if (capturedImages.length < 1) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp ít nhất 1 ảnh để đăng ký.');
      return;
    }

    if (!name.trim() || !studentId.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và mã sinh viên.');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerFace(
        capturedImages,
        {
          name: name.trim(),
          student_id: studentId.trim(),
          department: department.trim(),
          class: userClass.trim(),
          room: room.trim(),
        },
        serverUrl
      );

      Alert.alert(
        'Đăng ký thành công!',
        'Khuôn mặt của bạn đã được đăng ký vào hệ thống.',
        [
          {
            text: 'OK',
            onPress: () => {
              setCapturedImages([]);
              setName('');
              setStudentId('');
              setDepartment('');
              setUserClass('');
              setRoom('');
              setCurrentStep(0);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage = error.message || 'Không thể đăng ký khuôn mặt. Vui lòng thử lại.';
      Alert.alert(
        'Lỗi đăng ký',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Ứng dụng cần quyền truy cập camera để đăng ký khuôn mặt
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.permissionButton}>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Đăng ký khuôn mặt
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {CAPTURE_STEPS.map((step, index) => (
            <View key={step.id} style={styles.progressItem}>
              <View
                style={[
                  styles.progressCircle,
                  {
                    backgroundColor:
                      capturedImages[index]
                        ? colors.primary
                        : index === currentStep
                        ? colors.secondary
                        : colors.border,
                  },
                ]}
              >
                {capturedImages[index] ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={20}
                    color={index === currentStep ? '#FFFFFF' : colors.textSecondary}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color:
                      capturedImages[index] || index === currentStep
                        ? colors.text
                        : colors.textSecondary,
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Current Instruction */}
        {currentStep < CAPTURE_STEPS.length && !capturedImages[currentStep] && (
          <AnimatedView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              {CAPTURE_STEPS[currentStep].instruction}
            </Text>
          </AnimatedView>
        )}

        {/* Camera or Preview */}
        {capturedImages.length < 3 ? (
          <AnimatedView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.cameraContainer}
          >
            <View style={[styles.cameraWrapper, { borderColor: colors.primary }]}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
                mode="picture"
                onCameraReady={() => {
                  setCameraReady(true);
                  setCameraError(null);
                }}
                onMountError={(e) => {
                  setCameraError(e);
                  setCameraReady(false);
                  Alert.alert('Lỗi camera', 'Không thể khởi tạo camera. Vui lòng thử lại.');
                }}
              />
            </View>

            {/* Countdown disabled */}

            <TouchableOpacity
              style={styles.captureButton}
              onPress={startCountdown}
              disabled={false}
            >
              <LinearGradient
                colors={countdown > 0 ? [colors.border, colors.border] : GRADIENTS.primary}
                style={styles.captureGradient}
              >
                <Ionicons name="camera" size={32} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
            {/* Countdown disabled */}
          </AnimatedView>
        ) : (
          <View style={styles.previewContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ảnh đã chụp
            </Text>
            <View style={styles.previewGrid}>
              {capturedImages.map((uri, index) => (
                <View key={index} style={styles.previewItem}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => retakePhoto(index)}
                  >
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    {CAPTURE_STEPS[index].label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Registration Inputs */}
            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Tên của bạn</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Nhập tên đầy đủ"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mã sinh viên</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="VD: 20201234"
                placeholderTextColor={colors.textSecondary}
                value={studentId}
                onChangeText={setStudentId}
              />
            </View>

            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Khoa / Bộ môn</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="VD: CNTT"
                placeholderTextColor={colors.textSecondary}
                value={department}
                onChangeText={setDepartment}
              />
            </View>

            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Lớp</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="VD: KTPM01"
                placeholderTextColor={colors.textSecondary}
                value={userClass}
                onChangeText={setUserClass}
              />
            </View>

            <View style={styles.nameInputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phòng</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="VD: A101"
                placeholderTextColor={colors.textSecondary}
                value={room}
                onChangeText={setRoom}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={GRADIENTS.success}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Preview thumbnails */}
        {capturedImages.length > 0 && capturedImages.length < 3 && (
          <View style={styles.thumbnailContainer}>
            {capturedImages.map((uri, index) => (
              <View key={index} style={styles.thumbnail}>
                <Image source={{ uri }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  style={styles.thumbnailDelete}
                  onPress={() => retakePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: SPACING.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
  instruction: {
    fontSize: FONTS.sizes.lg,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontWeight: '500',
  },
  cameraContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  cameraWrapper: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: CAMERA_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  captureButton: {
    marginTop: SPACING.xl,
  },
  captureGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: CAMERA_SIZE / 2,
    zIndex: 10,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  countdownHint: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  retakeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 5,
  },
  previewLabel: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  nameInputContainer: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  submitButton: {
    marginBottom: SPACING.lg,
  },
  submitGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  thumbnail: {
    position: 'relative',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  thumbnailDelete: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  permissionText: {
    fontSize: FONTS.sizes.lg,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  permissionButton: {
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});

export default RegistrationScreen;


