import React from 'react';
import { Platform, View } from 'react-native';

// Conditional import Moti - chỉ khi không phải web
let MotiView;
try {
  if (Platform.OS !== 'web') {
    MotiView = require('moti').MotiView;
  }
} catch (error) {
  // Moti không khả dụng, sẽ dùng View fallback
  MotiView = null;
}

// Wrapper component để Moti hoạt động tốt trên cả mobile và web
// Trên web, fallback về View thông thường với Animated
const AnimatedView = React.memo(({ children, from, animate, transition, style, ...props }) => {
  // Trên web hoặc nếu Moti không khả dụng, dùng View thông thường
  if (Platform.OS === 'web' || !MotiView) {
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }

  // Trên mobile với Moti khả dụng, dùng MotiView
  return (
    <MotiView
      from={from}
      animate={animate}
      transition={transition}
      style={style}
      {...props}
    >
      {children}
    </MotiView>
  );
});

export default AnimatedView;


