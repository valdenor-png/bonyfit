import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import DadosScreen, { DadosForm } from '../screens/onboarding/DadosScreen';
import UnidadeScreen from '../screens/onboarding/UnidadeScreen';
import PlanoScreen from '../screens/onboarding/PlanoScreen';
import PagamentoScreen from '../screens/onboarding/PagamentoScreen';
import FacialScreen from '../screens/onboarding/FacialScreen';
import ContratoScreen from '../screens/onboarding/ContratoScreen';
import { PaymentMethod } from '../types/payment';

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

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
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
          <ContratoScreen {...props} onFinish={onComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
