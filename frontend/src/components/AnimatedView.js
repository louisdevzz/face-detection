import React from 'react';
import { Platform, View } from 'react-native';

// Tạm thời chỉ dùng View để tránh lỗi "Invalid hook call" với Moti
// Sau khi app chạy ổn định, có thể thêm lại Moti với lazy loading
const AnimatedView = ({ children, from, animate, transition, style, ...props }) => {
  // Hiện tại chỉ dùng View thông thường để app chạy được
  // TODO: Thêm lại Moti với lazy loading sau
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};

AnimatedView.displayName = 'AnimatedView';

export default AnimatedView;

