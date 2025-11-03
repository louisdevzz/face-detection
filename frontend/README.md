# FaceGate Access 🔐

A modern mobile face recognition application for access control systems, built with React Native and Expo. This app connects to the InsightFace-powered backend for accurate face detection and recognition.

## 🎯 Main Features

- **Real-time Face Recognition**: Automatically detect and verify faces using InsightFace
- **Multi-angle Registration**: Capture 3 different angles (front, left, right) for improved accuracy
- **User Profile Management**: Complete registration with name, student ID, department, class, and room
- **Intuitive Interface**: Minimal design, learn in 5 seconds
- **Auto Light/Dark Mode**: Supports both Light and Dark themes
- **Flexible API Connection**: Easy server URL configuration
- **Smooth Animations**: Uses Moti/Reanimated for fluid experience
- **Error Handling**: Comprehensive error messages and user feedback

## 🎨 Design

- **Style**: Clean, futuristic, AI-inspired
- **Colors**: White, light gray, blue-purple gradient (#6366F1)
- **Typography**: Modern sans-serif (System fonts)
- **Motion**: Smooth transitions with Moti

## 📱 Screens

### 1. Splash Screen
- App logo and name
- Smooth fade-in animation
- Auto-navigate after 2.5 seconds

### 2. Home Screen (Main)
- Circular camera preview
- Automatic face detection
- Display verification results (Approved/Denied)
- FAB button to register new faces
- Settings icon to configure the app

### 3. Registration Screen
- Step-by-step guide for capturing 3 angles:
  1. **Front**: Look straight at the camera
  2. **Left**: Turn face left 45°
  3. **Right**: Turn face right 45°
- Preview captured images
- Input user information:
  - Name (required)
  - Student ID (required)
  - Department (optional)
  - Class (optional)
  - Room (optional)
- Submit data to server

### 4. Settings Screen
- Toggle Light/Dark mode
- Switch between front/back camera
- Configure server URL
- Test server connection
- Display device information

## 🛠️ Tech Stack

- **Framework**: React Native 0.81.5 + Expo 54
- **Navigation**: React Navigation 7 (Native Stack)
- **Camera**: Expo Camera 17
- **Image Processing**: Expo Image Manipulator
- **Animation**: Moti 0.30 + Reanimated 4
- **State Management**: Zustand 5
- **Styling**: React Native StyleSheet
- **HTTP Client**: Axios 1.13
- **UI Components**: Expo Vector Icons, Linear Gradient, Blur
- **Platform**: iOS, Android, Web support

## 📦 Installation

### Prerequisites
- Node.js >= 18
- pnpm (recommended) or npm/yarn
- Expo Go app (for testing on real devices)

### Installation Steps

1. **Clone repository**
```bash
git clone <repository-url>
cd frontend
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Configure server URL**

Open `src/store/appStore.js` and change the `serverUrl`:
```javascript
serverUrl: 'http://YOUR_COMPUTER_IP:8000',
```

**Important Notes:**
- Replace `YOUR_COMPUTER_IP` with your computer's local IP address (not localhost)
- Default backend port is **8000** (Flask app runs on port 8000)
- Example: `http://192.168.1.7:8000`
- To find your IP:
  - **macOS/Linux**: `ifconfig | grep inet`
  - **Windows**: `ipconfig`

4. **Start the app**

Using tunnel mode (recommended for testing on real devices):
```bash
pnpm start:tunnel
# or
npm run start:tunnel
# or
npx expo start --tunnel
```

Without tunnel:
```bash
pnpm start
# or
npm start
```

Clear cache if needed:
```bash
rm -rf .expo node_modules/.cache .metro
npx expo start --clear
```

5. **Test on device**
- Install **Expo Go** from App Store (iOS) or Google Play (Android)
- Scan the QR code displayed in terminal
- Or press `i` to open iOS simulator, `a` for Android emulator

## 🔌 API Configuration

The app connects to the backend server with these endpoints:

### 1. Face Recognition
```
POST /recognize
Content-Type: multipart/form-data

Body:
- image: File (JPEG/PNG)
  OR
- image_base64: String (base64 encoded image)

Response (Success - 200):
{
  "recognized": true,
  "confidence": 0.8542,
  "user": {
    "user_id": "uuid-string",
    "profile": {
      "name": "User Name",
      "student_id": "ST001",
      "department": "Computer Science",
      "class": "CS301",
      "room": "212"
    },
    "registered_at": "2023-11-03T14:54:30",
    "updated_at": "2023-11-03T14:54:30"
  }
}

Response (Not Found - 404):
{
  "recognized": false,
  "message": "Face detected but no matching user found (threshold not met).",
  "confidence": 0.4133
}
```

### 2. User Registration
```
POST /register
Content-Type: multipart/form-data

Body:
- images: File[] (3 JPEG images - front, left, right angles)
- name: String (required)
- student_id: String (required)
- department: String (optional)
- class: String (optional)
- room: String (optional)

Response (Success - 201):
{
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid-string",
    "profile": {
      "name": "User Name",
      "student_id": "ST001",
      "class": "CS301",
      "department": "Computer Science",
      "room": "212"
    },
    "registered_at": "2023-11-03T14:54:30",
    "updated_at": "2023-11-03T14:54:30",
    "embedding_version": "insightface-buffalo_l-v1"
  }
}

Response (Error - 400):
{
  "error": "No face detected in the provided images. Please upload clear face images."
}
```

### 3. Server Health Check
```
GET /ping

Response (200):
{
  "status": "ok",
  "message": "Server is running"
}
```

## 🚀 Build for Production

### Android
```bash
# Using EAS Build (recommended)
eas build --platform android

# Or legacy build
npx expo build:android
```

### iOS
```bash
# Using EAS Build (recommended)
eas build --platform ios

# Or legacy build
npx expo build:ios
```

### Configure EAS
Create `eas.json` in project root:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 📝 Project Structure

```
frontend/
├── App.js                          # Entry point with navigation
├── index.js                        # Expo entry
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel config
├── assets/                         # Images and icons
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── components/                 # Reusable components
    │   ├── AnimatedView.js         # Moti animation wrapper
    │   ├── AnimatedView.backup.js
    │   ├── AnimatedView.simple.js
    │   └── ErrorBoundary.js        # Error boundary component
    ├── constants/                  # App constants
    │   └── theme.js                # Colors, spacing, fonts
    ├── screens/                    # Screen components
    │   ├── SplashScreen.js         # Initial splash screen
    │   ├── HomeScreen.js           # Main face recognition
    │   ├── RegistrationScreen.js   # User registration flow
    │   └── SettingsScreen.js       # App settings
    ├── store/                      # State management
    │   └── appStore.js             # Zustand store
    └── utils/                      # Utility functions
        └── api.js                  # API calls (axios)
```

## 🎯 UX Principles

**"Minimal interface, maximal intuition."**

- Users understand how to use it in 5 seconds
- Camera displays immediately on app open
- Clear colors and icons
- Subtle animations that don't distract
- Instant feedback for every action
- Comprehensive error messages
- Progressive disclosure of features

## 🔧 Troubleshooting

### Camera not working
- Check camera permissions in device Settings
- Restart the application
- Try switching camera (front/back)
- Ensure camera is not used by another app

### Cannot connect to server
- Check server URL in Settings (use IP address, not localhost)
- Ensure device and server are on the same network
- Verify backend server is running on port 8000
- Try test connection button in Settings
- Check firewall settings on server computer
- Common error: Using `localhost` instead of computer's IP address

Example correct URLs:
- ✅ `http://192.168.1.7:8000`
- ✅ `http://10.0.0.5:8000`
- ❌ `http://localhost:8000` (won't work on mobile device)

### App slow or laggy
- Close other running apps
- Restart device
- Clear app cache: Settings → Clear Data
- Check console logs for errors
- Reduce animation effects if needed

### Image upload fails
- Check image file size (should be < 5MB)
- Ensure all 3 images are captured
- Verify network connection
- Check backend logs for errors

### Face not detected during registration
- Ensure good lighting
- Keep face centered in frame
- Remove glasses or masks if possible
- Try all 3 capture angles
- Stand 30-50cm from camera

## 🔐 Permissions Required

### iOS
- Camera Access: Required for face capture
- Photo Library: Optional for image selection

### Android
- CAMERA: Required for face capture
- READ_EXTERNAL_STORAGE: Optional for image selection
- WRITE_EXTERNAL_STORAGE: Optional for saving images

Permissions are requested automatically when needed.

## ⚙️ Configuration Options

### Theme Configuration (`src/store/appStore.js`)
```javascript
isDarkMode: true/false  // Toggle dark mode
```

### Camera Configuration
```javascript
cameraType: 'front'/'back'  // Default camera
```

### API Configuration
```javascript
serverUrl: 'http://IP:8000'  // Backend server URL
```

### Image Quality (in screen components)
```javascript
quality: 0.7          // JPEG quality (0.0-1.0)
compress: 0.6         // Compression ratio
```

## 🌐 Supported Platforms

- ✅ **iOS**: 12.0+
- ✅ **Android**: 5.0+ (API 21+)
- ✅ **Web**: Modern browsers (limited camera support)

## 📊 Performance Tips

- Use tunnel mode for stable connections
- Keep images under 2MB each
- Close background apps during recognition
- Use front camera for better face detection
- Ensure stable network connection
- Test on real devices, not just simulators

## 📄 License

MIT License - Free to use for personal and commercial purposes.

## 👨‍💻 Author

FaceGate Access Team

## 🙏 Credits

- React Native & Expo team
- InsightFace for face recognition backend
- Moti for smooth animations
- Zustand for state management
- All open source contributors

## 🔗 Related Projects

- **Backend**: Flask API with InsightFace (buffalo_l model)
- **Documentation**: See `../README.md` for backend setup

---

**"Smart. Secure. Seamless."**
