import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedView from '../components/AnimatedView';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../store/appStore';
import { COLORS, GRADIENTS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';
import { testServerConnection } from '../utils/api';
import * as Device from 'expo-device';

const SettingsScreen = ({ navigation }) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const cameraType = useAppStore((state) => state.cameraType);
  const toggleCamera = useAppStore((state) => state.toggleCamera);
  const serverUrl = useAppStore((state) => state.serverUrl);
  const setServerUrl = useAppStore((state) => state.setServerUrl);
  
  const colors = isDarkMode ? COLORS.dark : COLORS.light;
  const [editedServerUrl, setEditedServerUrl] = useState(serverUrl);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      await testServerConnection(editedServerUrl);
      Alert.alert(
        '✅ Kết nối thành công',
        'Máy chủ đang hoạt động bình thường.'
      );
    } catch (error) {
      const errorMessage = error.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra URL và thử lại.';
      Alert.alert(
        '❌ Kết nối thất bại',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveServerUrl = () => {
    setServerUrl(editedServerUrl);
    Alert.alert('Đã lưu', 'URL máy chủ đã được cập nhật.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Cài đặt
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance Section */}
        <AnimatedView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Giao diện
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDarkMode ? 'moon' : 'sunny'}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Chế độ tối
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </AnimatedView>

        {/* Camera Section */}
        <AnimatedView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
        >
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Camera
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="camera-reverse"
                  size={24}
                  color={colors.primary}
                />
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Vị trí camera
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Hiện tại: {cameraType === 'front' ? 'Trước' : 'Sau'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={toggleCamera}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.smallButton}
                >
                  <Text style={styles.smallButtonText}>Đổi</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedView>

        {/* Server Configuration */}
        <AnimatedView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
        >
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Cấu hình máy chủ
            </Text>
            
            <View style={styles.serverConfig}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                URL máy chủ API
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={editedServerUrl}
                onChangeText={setEditedServerUrl}
                placeholder="http://example.com/api"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={{ flex: 1, marginRight: SPACING.sm }}
                  onPress={handleSaveServerUrl}
                  disabled={editedServerUrl === serverUrl}
                >
                  <LinearGradient
                    colors={
                      editedServerUrl === serverUrl
                        ? [colors.border, colors.border]
                        : GRADIENTS.primary
                    }
                    style={styles.actionButton}
                  >
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Lưu</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, marginLeft: SPACING.sm }}
                  onPress={handleTestConnection}
                  disabled={isTesting}
                >
                  <LinearGradient
                    colors={GRADIENTS.success}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name={isTesting ? 'sync' : 'checkmark-circle'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>
                      {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AnimatedView>

        {/* Device Info */}
        <AnimatedView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
        >
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Thông tin thiết bị
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Tên thiết bị:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {Device.deviceName || 'Không xác định'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Hệ điều hành:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Device.osVersion}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Model:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {Device.modelName || 'Không xác định'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                ID thiết bị:
              </Text>
              <Text
                style={[styles.infoValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {Device.modelId || 'N/A'}
              </Text>
            </View>
          </View>
        </AnimatedView>

        {/* About */}
        <AnimatedView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 500 }}
        >
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Về ứng dụng
            </Text>
            
            <View style={styles.aboutContent}>
              <Ionicons name="scan-circle" size={60} color={colors.primary} />
              <Text style={[styles.appName, { color: colors.text }]}>
                FaceGate Access
              </Text>
              <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
                Phiên bản 1.0.0
              </Text>
              <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                Thông minh. An toàn. Liền mạch.
              </Text>
            </View>
          </View>
        </AnimatedView>
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
    paddingBottom: SPACING.xxl,
  },
  section: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: FONTS.sizes.sm,
    marginTop: 2,
  },
  smallButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  serverConfig: {
    marginTop: SPACING.sm,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: FONTS.sizes.sm,
    flex: 1,
  },
  infoValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  appName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  appVersion: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  appTagline: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;


