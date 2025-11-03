# FaceGate Access 🔐

Ứng dụng mobile nhận diện khuôn mặt hiện đại cho hệ thống kiểm soát ra vào, được xây dựng với React Native và Expo.

## 🎯 Tính năng chính

- **Nhận diện khuôn mặt thời gian thực**: Tự động phát hiện và xác thực khuôn mặt
- **Đăng ký người dùng mới**: Chụp 3 góc độ khác nhau để tăng độ chính xác
- **Giao diện trực quan**: Thiết kế tối giản, học trong 5 giây
- **Chế độ sáng/tối tự động**: Hỗ trợ cả Light và Dark mode
- **Kết nối API linh hoạt**: Cấu hình server URL dễ dàng
- **Animations mượt mà**: Sử dụng Moti/Reanimated cho trải nghiệm mượt mà

## 🎨 Thiết kế

- **Phong cách**: Clean, futuristic, AI-inspired
- **Màu sắc**: White, light gray, blue-purple gradient
- **Typography**: Modern sans-serif (System)
- **Motion**: Smooth transitions với Moti

## 📱 Màn hình

### 1. Splash Screen
- Logo và tên ứng dụng
- Animation fade-in mượt mà
- Auto-navigate sau 2.5 giây

### 2. Home Screen (Màn hình chính)
- Camera preview hình tròn
- Phát hiện khuôn mặt tự động (có nút test)
- Hiển thị kết quả xác thực (Approved/Denied)
- FAB button để đăng ký khuôn mặt mới

### 3. Registration Screen
- Hướng dẫn chụp 3 góc độ (front, left, right)
- Preview ảnh đã chụp
- Nhập tên người dùng
- Gửi dữ liệu lên server

### 4. Settings Screen
- Toggle Light/Dark mode
- Chuyển đổi camera trước/sau
- Cấu hình server URL
- Test kết nối server
- Hiển thị thông tin thiết bị

## 🛠️ Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **Camera**: Expo Camera
- **Animation**: Moti
- **State Management**: Zustand
- **Styling**: React Native StyleSheet
- **API**: Axios
- **Icons**: @expo/vector-icons

## 📦 Cài đặt

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn
- Expo Go app (cho testing trên thiết bị thật)

### Các bước cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd asi2
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình server URL**
- Mở file `src/store/appStore.js`
- Thay đổi `serverUrl` thành URL của backend server của bạn
```javascript
serverUrl: 'http://your-server-url/api',
```

4. **Chạy ứng dụng**
## 🚀 Command để chạy app:

```bash
npm run start:tunnel
```

Hoặc:

```bash
npm start -- --tunnel
```

---
Hoặc:

```bash
cd /home/thuypm/Desktop/ttu/htpt/asi2
./debug_expo.sh
```
# Clear cache
```bash
rm -rf .expo node_modules/.cache .metro

# Start với tunnel
npx expo start --tunnel --clear
---
```

5. **Test trên thiết bị**
- Cài đặt **Expo Go** từ App Store (iOS) hoặc Google Play (Android)
- Quét QR code hiển thị trong terminal
- Hoặc nhấn `i` để mở iOS simulator, `a` cho Android emulator

## 🔌 Cấu hình API

Ứng dụng cần kết nối với backend server có các endpoints sau:

### 1. Verify Face (Xác thực khuôn mặt)
```
POST /api/verify
Content-Type: multipart/form-data

Body:
- image: File (JPEG/PNG)

Response:
{
  "success": true/false,
  "name": "Tên người dùng" (nếu success),
  "confidence": 0.95 (optional)
}
```

### 2. Register Face (Đăng ký khuôn mặt)
```
POST /api/register
Content-Type: multipart/form-data

Body:
- images: File[] (3 ảnh)
- name: String

Response:
{
  "success": true,
  "message": "Registration successful",
  "userId": "xxx"
}
```

### 3. Ping (Kiểm tra kết nối)
```
GET /api/ping

Response:
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## 🚀 Build cho Production

### Android
```bash
npx expo build:android
# hoặc với EAS
eas build --platform android
```

### iOS
```bash
npx expo build:ios
# hoặc với EAS
eas build --platform ios
```

## 📝 Cấu trúc dự án

```
asi2/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── package.json                    # Dependencies
├── src/
│   ├── screens/                    # Các màn hình
│   │   ├── SplashScreen.js
│   │   ├── HomeScreen.js
│   │   ├── RegistrationScreen.js
│   │   └── SettingsScreen.js
│   ├── store/                      # State management
│   │   └── appStore.js
│   ├── utils/                      # Utilities
│   │   └── api.js
│   └── constants/                  # Constants
│       └── theme.js
└── README.md
```

## 🎯 Nguyên tắc UX

**"Minimal interface, maximal intuition."**

- Người dùng hiểu cách sử dụng trong 5 giây
- Camera hiển thị ngay khi mở app
- Màu sắc và icon rõ ràng
- Animations tinh tế, không làm phiền
- Feedback tức thời cho mọi hành động

## 🔧 Troubleshooting

### Lỗi camera không hoạt động
- Kiểm tra quyền camera trong Settings của thiết bị
- Restart ứng dụng
- Thử chuyển đổi camera (front/back)

### Không kết nối được server
- Kiểm tra URL server trong Settings
- Đảm bảo thiết bị và server cùng mạng (nếu dùng localhost)
- Thử test connection trong Settings

### App chậm hoặc lag
- Đóng các app khác đang chạy
- Restart thiết bị
- Check console logs để xem lỗi

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## 👨‍💻 Tác giả

FaceGate Access Team

## 🙏 Credits

- React Native & Expo team
- Moti for smooth animations
- Zustand for state management
- All open source contributors

---

**"Thông minh. An toàn. Liền mạch."**

