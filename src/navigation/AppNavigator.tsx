import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../tokens';
import {
  TabParamList,
  FeedStackParamList,
  ProfileStackParamList,
  TreinoStackParamList,
  RankingStackParamList,
  PersonalStackParamList,
} from './types';

// Screens
import FeedScreen from '../screens/FeedScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';
import ChatScreen from '../screens/ChatScreen';
import GruposScreen from '../screens/GruposScreen';
import DesafiosScreen from '../screens/DesafiosScreen';
import RankingScreen from '../screens/RankingScreen';
import RecompensasScreen from '../screens/RecompensasScreen';
import TreinoScreen from '../screens/TreinoScreen';
import TreinosProntosScreen from '../screens/TreinosProntosScreen';
import HistoricoTreinoScreen from '../screens/HistoricoTreinoScreen';
import PersonalScreen from '../screens/PersonalScreen';
import AgendamentoPersonalScreen from '../screens/AgendamentoPersonalScreen';
import AulasScreen from '../screens/AulasScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoricoFinanceiroScreen from '../screens/HistoricoFinanceiroScreen';
import FrequenciaScreen from '../screens/FrequenciaScreen';
import AnamneseScreen from '../screens/AnamneseScreen';
import AvaliacaoFisicaScreen from '../screens/AvaliacaoFisicaScreen';
import PesoScreen from '../screens/PesoScreen';
import NutricaoScreen from '../screens/NutricaoScreen';
import AulasOnlineScreen from '../screens/AulasOnlineScreen';
import SuporteScreen from '../screens/SuporteScreen';
import AgendamentoScreen from '../screens/AgendamentoScreen';
import Skull from '../components/Skull';

const Tab = createBottomTabNavigator<TabParamList>();
const FeedStack = createStackNavigator<FeedStackParamList>();
const TreinoStack = createStackNavigator<TreinoStackParamList>();
const RankingStack = createStackNavigator<RankingStackParamList>();
const PersonalStack = createStackNavigator<PersonalStackParamList>();
const ProfileStackNav = createStackNavigator<ProfileStackParamList>();

const stackOptions = { headerShown: false, cardStyle: { backgroundColor: colors.bg } } as const;

function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={stackOptions}>
      <FeedStack.Screen name="FeedMain" component={FeedScreen} />
      <FeedStack.Screen name="ProfileView" component={ProfileViewScreen} />
      <FeedStack.Screen name="Chat" component={ChatScreen} />
      <FeedStack.Screen name="Grupos" component={GruposScreen} />
      <FeedStack.Screen name="Desafios" component={DesafiosScreen} />
    </FeedStack.Navigator>
  );
}

function TreinoNavigator() {
  return (
    <TreinoStack.Navigator screenOptions={stackOptions}>
      <TreinoStack.Screen name="TreinoMain" component={TreinoScreen} />
      <TreinoStack.Screen name="TreinosProntos" component={TreinosProntosScreen} />
      <TreinoStack.Screen name="HistoricoTreino" component={HistoricoTreinoScreen} />
    </TreinoStack.Navigator>
  );
}

function RankingNavigator() {
  return (
    <RankingStack.Navigator screenOptions={stackOptions}>
      <RankingStack.Screen name="RankingMain" component={RankingScreen} />
      <RankingStack.Screen name="Recompensas" component={RecompensasScreen} />
    </RankingStack.Navigator>
  );
}

function PersonalNavigator() {
  return (
    <PersonalStack.Navigator screenOptions={stackOptions}>
      <PersonalStack.Screen name="PersonalMain" component={PersonalScreen} />
      <PersonalStack.Screen name="AgendamentoPersonal" component={AgendamentoPersonalScreen} />
      <PersonalStack.Screen name="Aulas" component={AulasScreen} />
    </PersonalStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackOptions}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Settings" component={SettingsScreen} />
      <ProfileStackNav.Screen name="HistoricoFinanceiro" component={HistoricoFinanceiroScreen} />
      <ProfileStackNav.Screen name="Frequencia" component={FrequenciaScreen} />
      <ProfileStackNav.Screen name="Anamnese" component={AnamneseScreen} />
      <ProfileStackNav.Screen name="AvaliacaoFisica" component={AvaliacaoFisicaScreen} />
      <ProfileStackNav.Screen name="Peso" component={PesoScreen} />
      <ProfileStackNav.Screen name="Nutricao" component={NutricaoScreen} />
      <ProfileStackNav.Screen name="AulasOnline" component={AulasOnlineScreen} />
      <ProfileStackNav.Screen name="Suporte" component={SuporteScreen} />
      <ProfileStackNav.Screen name="Agendamento" component={AgendamentoScreen} />
    </ProfileStackNav.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Feed: '📱',
    Ranking: '🏆',
    Treino: '💪',
    Personal: '👤',
    Perfil: '⚙',
  };

  if (name === 'Treino') {
    return (
      <View style={[tabStyles.centerBtn, focused && tabStyles.centerBtnActive]}>
        <Skull size={22} color={focused ? '#FFFFFF' : colors.textMuted} />
      </View>
    );
  }

  return (
    <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
      {icons[name] || '•'}
    </Text>
  );
}

const tabStyles = StyleSheet.create({
  icon: { fontSize: 20, opacity: 0.5 },
  iconActive: { opacity: 1 },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centerBtnActive: {
    backgroundColor: colors.orange,
  },
});

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.elevated,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.bodyMedium,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen name="Ranking" component={RankingNavigator} />
      <Tab.Screen
        name="Treino"
        component={TreinoNavigator}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen name="Personal" component={PersonalNavigator} />
      <Tab.Screen name="Perfil" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
