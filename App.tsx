import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Sora_400Regular,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import * as SplashScreen from 'expo-splash-screen';

import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    Sora_400Regular,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F26522" />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#F26522',
            background: '#0A0A0A',
            card: '#141414',
            text: '#FFFFFF',
            border: '#222222',
            notification: '#F26522',
          },
          fonts: {
            regular: { fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' },
            medium: { fontFamily: 'PlusJakartaSans_500Medium', fontWeight: '500' },
            bold: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
            heavy: { fontFamily: 'Sora_800ExtraBold', fontWeight: '800' },
          },
        }}
      >
        {isAuthenticated ? (
          <AppNavigator />
        ) : (
          <AuthNavigator onComplete={() => setIsAuthenticated(true)} />
        )}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
