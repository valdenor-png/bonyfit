import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
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
