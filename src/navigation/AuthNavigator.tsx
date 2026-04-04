import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import DadosPessoaisScreen from '../screens/onboarding/DadosPessoaisScreen';
import QuestionarioSaudeScreen from '../screens/onboarding/QuestionarioSaudeScreen';
import ContratoDigitalScreen from '../screens/onboarding/ContratoDigitalScreen';
import AssinaturaDigitalScreen from '../screens/onboarding/AssinaturaDigitalScreen';
import EscolhaPlanoScreen from '../screens/onboarding/EscolhaPlanoScreen';
import ConfirmacaoScreen from '../screens/onboarding/ConfirmacaoScreen';

const Stack = createStackNavigator<AuthStackParamList>();

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
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onComplete} />}
      </Stack.Screen>
      <Stack.Screen name="DadosPessoais" component={DadosPessoaisScreen} />
      <Stack.Screen name="QuestionarioSaude" component={QuestionarioSaudeScreen} />
      <Stack.Screen name="ContratoDigital" component={ContratoDigitalScreen} />
      <Stack.Screen name="AssinaturaDigital" component={AssinaturaDigitalScreen} />
      <Stack.Screen name="EscolhaPlano" component={EscolhaPlanoScreen} />
      <Stack.Screen name="Confirmacao">
        {(props) => <ConfirmacaoScreen {...props} onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
