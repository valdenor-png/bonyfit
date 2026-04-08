import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ConfettiBurstRef {
  fire: () => void;
}

interface Props {
  count?: number;
}

const ConfettiBurst = forwardRef<ConfettiBurstRef, Props>(({ count = 80 }, ref) => {
  const confettiRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    fire: () => {
      confettiRef.current?.start();
    },
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={count}
        origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
        colors={['#F26522', '#FFD700', '#FF4500', '#FFFFFF', '#A855F7']}
        fadeOut
        autoStart={false}
        explosionSpeed={350}
        fallSpeed={3000}
      />
    </View>
  );
});

ConfettiBurst.displayName = 'ConfettiBurst';
export default ConfettiBurst;
