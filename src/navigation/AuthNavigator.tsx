import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/onboarding/LoginScreen';

const Stack = createStackNavigator();

interface Props {
  onComplete: () => void;
}

export default function AuthNavigator({ onComplete }: Props) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
