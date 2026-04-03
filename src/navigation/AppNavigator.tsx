import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../tokens';
import Skull from '../components/Skull';

// Screens
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';
import ChatScreen from '../screens/ChatScreen';
import TreinoScreen from '../screens/TreinoScreen';
import TreinosProntosScreen from '../screens/TreinosProntosScreen';
import HistoricoTreinoScreen from '../screens/HistoricoTreinoScreen';
import AgendamentoScreen from '../screens/AgendamentoScreen';
import AgendamentoPersonalScreen from '../screens/AgendamentoPersonalScreen';
import AulasScreen from '../screens/AulasScreen';
import MenuScreen from '../screens/MenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RankingScreen from '../screens/RankingScreen';
import RecompensasScreen from '../screens/RecompensasScreen';
import PersonalScreen from '../screens/PersonalScreen';
import GruposScreen from '../screens/GruposScreen';
import DesafiosScreen from '../screens/DesafiosScreen';
import HistoricoFinanceiroScreen from '../screens/HistoricoFinanceiroScreen';
import FrequenciaScreen from '../screens/FrequenciaScreen';
import AnamneseScreen from '../screens/AnamneseScreen';
import AvaliacaoFisicaScreen from '../screens/AvaliacaoFisicaScreen';
import PesoScreen from '../screens/PesoScreen';
import NutricaoScreen from '../screens/NutricaoScreen';
import AulasOnlineScreen from '../screens/AulasOnlineScreen';
import SuporteScreen from '../screens/SuporteScreen';
import PerfilPessoalScreen from '../screens/PerfilPessoalScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator<any>();
const FeedStack = createStackNavigator<any>();
const TreinoStack = createStackNavigator<any>();
const AgendaStack = createStackNavigator<any>();
const MenuStack = createStackNavigator<any>();

const stackOptions = { headerShown: false, cardStyle: { backgroundColor: colors.bg } } as const;

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="PerfilPessoal" component={PerfilPessoalScreen} />
      <HomeStack.Screen name="HistoricoFinanceiro" component={HistoricoFinanceiroScreen} />
    </HomeStack.Navigator>
  );
}

function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={stackOptions}>
      <FeedStack.Screen name="FeedMain" component={FeedScreen} />
      <FeedStack.Screen name="ProfileView">
        {(props: any) => <ProfileViewScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="Chat">
        {(props: any) => <ChatScreen {...props} />}
      </FeedStack.Screen>
    </FeedStack.Navigator>
  );
}

function TreinoNavigator() {
  return (
    <TreinoStack.Navigator screenOptions={stackOptions}>
      <TreinoStack.Screen name="TreinoMain" component={TreinoScreen} />
    </TreinoStack.Navigator>
  );
}

function AgendaNavigator() {
  return (
    <AgendaStack.Navigator screenOptions={stackOptions}>
      <AgendaStack.Screen name="AgendamentoMain" component={AgendamentoScreen} />
      <AgendaStack.Screen name="AgendamentoPersonal" component={AgendamentoPersonalScreen} />
      <AgendaStack.Screen name="Aulas" component={AulasScreen} />
    </AgendaStack.Navigator>
  );
}

function MenuNavigator() {
  return (
    <MenuStack.Navigator screenOptions={stackOptions}>
      <MenuStack.Screen name="MenuMain" component={MenuScreen} />
      <MenuStack.Screen name="ProfileMain" component={ProfileScreen} />
      <MenuStack.Screen name="Settings" component={SettingsScreen} />
      <MenuStack.Screen name="Ranking" component={RankingScreen} />
      <MenuStack.Screen name="Recompensas" component={RecompensasScreen} />
      <MenuStack.Screen name="TreinosProntos" component={TreinosProntosScreen} />
      <MenuStack.Screen name="HistoricoTreino" component={HistoricoTreinoScreen} />
      <MenuStack.Screen name="Personal" component={PersonalScreen} />
      <MenuStack.Screen name="Grupos" component={GruposScreen} />
      <MenuStack.Screen name="Desafios" component={DesafiosScreen} />
      <MenuStack.Screen name="HistoricoFinanceiro" component={HistoricoFinanceiroScreen} />
      <MenuStack.Screen name="Frequencia" component={FrequenciaScreen} />
      <MenuStack.Screen name="Anamnese" component={AnamneseScreen} />
      <MenuStack.Screen name="AvaliacaoFisica" component={AvaliacaoFisicaScreen} />
      <MenuStack.Screen name="Peso" component={PesoScreen} />
      <MenuStack.Screen name="Nutricao" component={NutricaoScreen} />
      <MenuStack.Screen name="AulasOnline" component={AulasOnlineScreen} />
      <MenuStack.Screen name="Suporte" component={SuporteScreen} />
      <MenuStack.Screen name="Aulas" component={AulasScreen} />
    </MenuStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  if (name === 'Treino') {
    return (
      <View style={[tabStyles.centerBtn, focused && tabStyles.centerBtnActive]}>
        <Skull size={22} color={focused ? '#FFFFFF' : colors.textMuted} />
      </View>
    );
  }

  const icons: Record<string, string> = {
    Home: '🏠',
    Feed: '📱',
    Agenda: '📅',
    Menu: '☰',
  };

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
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen
        name="Treino"
        component={TreinoNavigator}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen name="Agenda" component={AgendaNavigator} />
      <Tab.Screen name="Menu" component={MenuNavigator} />
    </Tab.Navigator>
  );
}
