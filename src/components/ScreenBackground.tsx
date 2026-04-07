import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { colors } from '../tokens';

const bgImage = require('../../assets/images/bg-stone.jpg');

interface Props {
  children: React.ReactNode;
  opacity?: number;
}

export default function ScreenBackground({ children, opacity = 0.15 }: Props) {
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
