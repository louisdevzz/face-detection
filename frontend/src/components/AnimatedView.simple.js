import React from 'react';
import { View } from 'react-native';

// Simple version - chỉ dùng View, không dùng Moti
// Dùng tạm thời để test app có chạy không
const AnimatedView = ({ children, style, ...props }) => {
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};

export default AnimatedView;



