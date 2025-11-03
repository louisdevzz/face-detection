import axios from 'axios';

export const verifyFace = async (imageUri, serverUrl) => {
  try {
    console.log('🔍 verifyFace: Starting verification with imageUri:', imageUri);
    console.log('🔍 verifyFace: serverUrl:', serverUrl);

    const formData = new FormData();
    if (typeof imageUri === 'string' && imageUri.startsWith('data:')) {
      console.log('📸 verifyFace: Sending as base64');
      formData.append('image_base64', imageUri);
    } else {
      console.log('📸 verifyFace: Sending as file URI');
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      });
    }

    console.log('🌐 verifyFace: Sending request to', `${serverUrl}/recognize`);
    const response = await axios.post(`${serverUrl}/recognize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 10000,
    });

    console.log('✅ verifyFace: Success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Face verification error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Xử lý lỗi chi tiết hơn
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Kết nối timeout. Vui lòng kiểm tra kết nối mạng.');
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      throw new Error(`Không thể kết nối đến server.\nURL: ${serverUrl}\n\nVui lòng kiểm tra:\n- Server có đang chạy không?\n- URL có đúng không?\n- Cùng WiFi/network không?`);
    } else if (error.response) {
      const backendError = error.response.data?.error || error.response.data?.message;
      console.error('❌ Backend error message:', backendError);
      throw new Error(backendError || `Server error: ${error.response.status} - ${error.response.statusText}`);
    } else {
      throw new Error(error.message || 'Lỗi không xác định khi xác thực khuôn mặt.');
    }
  }
};

// Register a user with multiple JPEG files
// images: string[] of file URIs
// profile: { name, student_id, department, class: userClass, room }
export const registerFace = async (images, profile, serverUrl) => {
  try {
    // Validate required fields before making request
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('At least one image URI is required');
    }
    if (!profile?.name || !profile?.student_id) {
      throw new Error('Name and student_id are required');
    }

    const formData = new FormData();

    // Append images[] - files only (already saved as JPEG files)
    console.log('📸 Registering face with images:', images);
    console.log('👤 Profile:', profile);
    images.forEach((uri, idx) => {
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: `face_${idx + 1}.jpg`,
      });
    });

    // Always append required fields (name and student_id are required by backend)
    formData.append('name', profile.name);
    formData.append('student_id', profile.student_id);
    
    // Append optional fields if they exist
    if (profile.department) formData.append('department', profile.department);
    if (profile.class) formData.append('class', profile.class);
    if (profile.room) formData.append('room', profile.room);

    const response = await axios.post(`${serverUrl}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error('Face registration error:', error);
    
    // Xử lý lỗi chi tiết hơn
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Kết nối timeout. Vui lòng kiểm tra kết nối mạng.');
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      throw new Error(`Không thể kết nối đến server.\nURL: ${serverUrl}\n\nVui lòng kiểm tra:\n- Server có đang chạy không?\n- URL có đúng không?\n- Cùng WiFi/network không?`);
    } else if (error.response) {
      // Show backend error message if available
      const backendError = error.response.data?.error || error.response.data?.message;
      const status = error.response.status;
      throw new Error(backendError || `Server error: ${status} - ${error.response.statusText}`);
    } else {
      throw new Error(error.message || 'Lỗi không xác định khi đăng ký khuôn mặt.');
    }
  }
};

export const testServerConnection = async (serverUrl) => {
  try {
    const response = await axios.get(`${serverUrl}/ping`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('Server connection error:', error);
    
    // Xử lý lỗi chi tiết hơn
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Kết nối timeout. Vui lòng kiểm tra kết nối mạng.');
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      throw new Error(`Không thể kết nối đến server.\nURL: ${serverUrl}\n\nVui lòng kiểm tra:\n- Server có đang chạy không?\n- URL có đúng không?\n- Cùng WiFi/network không?\n- Nếu test trên thiết bị, thay localhost bằng IP máy tính.`);
    } else if (error.response) {
      throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      throw new Error(error.message || 'Lỗi không xác định khi kiểm tra server.');
    }
  }
};


