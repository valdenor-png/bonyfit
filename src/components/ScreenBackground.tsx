import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens';

const bgImage = require('../../assets/images/Phoenix_10_Dark_seamless_background_texture_black_metal_diamon_3.jpg');

interface Props {
  children: React.ReactNode;
  opacity?: number;
}

export default function ScreenBackground({ children, opacity = 0.16 }: Props) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={bgImage}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity }}
        resizeMode="cover"
      />
      {/* Subtle orange radial glow from top-right corner */}
      <LinearGradient
        colors={['rgba(242,101,34,0.08)', 'transparent', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
