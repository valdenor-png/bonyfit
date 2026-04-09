import React from 'react';
import { ImageBackground, StyleSheet, View, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens';

const bgDefault = require('../../assets/images/Phoenix_10_Dark_seamless_background_texture_black_metal_diamon_3.jpg');

const bgVariants: Record<string, ImageSourcePropType> = {
  home: require('../../assets/images/bg-home.jpg'),
  feed: require('../../assets/images/bg-feed.jpg'),
  treino: require('../../assets/images/bg-treino.jpg'),
  loja: require('../../assets/images/bg-loja.jpg'),
  menu: require('../../assets/images/bg-menu.jpg'),
};

export type ScreenVariant = 'home' | 'feed' | 'treino' | 'loja' | 'menu';

interface Props {
  children: React.ReactNode;
  opacity?: number;
  variant?: ScreenVariant;
}

export default function ScreenBackground({ children, opacity = 0.16, variant }: Props) {
  const bgImage = variant ? bgVariants[variant] : bgDefault;
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
