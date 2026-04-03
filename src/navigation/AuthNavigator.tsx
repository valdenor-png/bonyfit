import React, { useState } from 'react';
import { Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import DadosScreen, { DadosForm } from '../screens/onboarding/DadosScreen';
import UnidadeScreen from '../screens/onboarding/UnidadeScreen';
import PlanoScreen from '../screens/onboarding/PlanoScreen';
import PagamentoScreen from '../screens/onboarding/PagamentoScreen';
import FacialScreen from '../screens/onboarding/FacialScreen';
import ContratoScreen from '../screens/onboarding/ContratoScreen';
import { PaymentMethod } from '../types/payment';
import { supabase } from '../services/supabase';

const Stack = createStackNavigator<AuthStackParamList>();

interface Props {
  onComplete: () => void;
}

export default function AuthNavigator({ onComplete }: Props) {
  const [formData, setFormData] = useState({
    dados: null as DadosForm | null,
    unitId: null as string | null,
    planId: null as string | null,
    paymentMethod: null as PaymentMethod | null,
    facialUri: null as string | null,
  });

  const selectedPlan = formData.planId
    ? {
        id: formData.planId,
        price:
          formData.planId === 'mensal'
            ? 89.9
            : formData.planId === 'trimestral'
            ? 69.9
            : 49.9,
      }
    : null;

  const handleFinishSignUp = async () => {
    const { dados, unitId, planId, facialUri } = formData;
    if (!dados) {
      Alert.alert('Erro', 'Dados pessoais não preenchidos.');
      return;
    }

    try {
      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dados.email,
        password: dados.password,
      });

      if (authError) {
        Alert.alert('Erro ao criar conta', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Erro', 'Não foi possível criar a conta.');
        return;
      }

      // 2. Inserir na tabela users
      const cpfClean = dados.cpf.replace(/\D/g, '');
      const phoneClean = dados.phone.replace(/\D/g, '');

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: dados.name,
        cpf: cpfClean,
        email: dados.email,
        phone: phoneClean,
        unit_id: unitId,
        plan_id: planId,
        facial_url: facialUri,
        facial_registered: !!facialUri,
        contract_accepted: true,
        contract_accepted_at: new Date().toISOString(),
      });

      if (insertError) {
        Alert.alert('Erro ao salvar dados', insertError.message);
        return;
      }

      // 3. Sucesso — ir pro app
      Alert.alert(
        'Conta criada!',
        'Bem-vindo à Bony Fit! Seu treino começa agora.',
        [{ text: 'Bora!', onPress: onComplete }]
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro inesperado ao criar conta.');
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen {...props} onLoginSuccess={onComplete} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Dados">
        {(props) => (
          <DadosScreen
            {...props}
            onNext={(dados) => setFormData((f) => ({ ...f, dados }))}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Unidade">
        {(props) => (
          <UnidadeScreen
            {...props}
            onNext={(unitId) => setFormData((f) => ({ ...f, unitId }))}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Plano">
        {(props) => (
          <PlanoScreen
            {...props}
            onNext={(planId) => setFormData((f) => ({ ...f, planId }))}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Pagamento">
        {(props) => (
          <PagamentoScreen
            {...props}
            selectedPlan={selectedPlan}
            onNext={(method) => setFormData((f) => ({ ...f, paymentMethod: method }))}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Facial">
        {(props) => (
          <FacialScreen
            {...props}
            onNext={(uri) => setFormData((f) => ({ ...f, facialUri: uri }))}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Contrato">
        {(props) => (
          <ContratoScreen {...props} onFinish={handleFinishSignUp} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
