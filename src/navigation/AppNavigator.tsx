import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../tokens';
import Skull from '../components/Skull';
import { useModeStore } from '../stores/modeStore';

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
import AguaScreen from '../screens/AguaScreen';
import JejumScreen from '../screens/JejumScreen';
import ReceitasScreen from '../screens/ReceitasScreen';
import DiarioAlimentarScreen from '../screens/DiarioAlimentarScreen';
import StoriesScreen from '../screens/StoriesScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import CompararScreen from '../screens/CompararScreen';
import MissoesScreen from '../screens/MissoesScreen';
import LigasScreen from '../screens/LigasScreen';
import PeriodizacaoScreen from '../screens/PeriodizacaoScreen';
import ScannerScreen from '../screens/ScannerScreen';
import LGPDScreen from '../screens/LGPDScreen';
import RelatorioScreen from '../screens/RelatorioScreen';
import ListaComprasScreen from '../screens/ListaComprasScreen';

// New screens
import LojaScreen from '../screens/loja/LojaScreen';
import LojaCategoriaScreen from '../screens/loja/LojaCategoriaScreen';
import LojaProdutoDetalheScreen from '../screens/loja/LojaProdutoDetalheScreen';
import MinhasAulasScreen from '../screens/professor/MinhasAulasScreen';
import AulaAtivaScreen from '../screens/professor/AulaAtivaScreen';
import AulaFinalizadaScreen from '../screens/professor/AulaFinalizadaScreen';
import ScanQRAulaScreen from '../screens/ScanQRAulaScreen';
import IndicarAmigosScreen from '../screens/indicacao/IndicarAmigosScreen';
import HistoricoAvaliacoesScreen from '../screens/HistoricoAvaliacoesScreen';

const AlunoTab = createBottomTabNavigator();
const ProfessorTab = createBottomTabNavigator();
const HomeStack = createStackNavigator<any>();
const FeedStack = createStackNavigator<any>();
const TreinoStack = createStackNavigator<any>();
const LojaStack = createStackNavigator<any>();
const MenuStack = createStackNavigator<any>();

// Professor stacks
const MinhasAulasStack = createStackNavigator<any>();
const PresencaStack = createStackNavigator<any>();
const HistoricoStack = createStackNavigator<any>();
const AgendaProfStack = createStackNavigator<any>();

const stackOptions = { headerShown: false, cardStyle: { backgroundColor: colors.bg } } as const;

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="PerfilPessoal" component={PerfilPessoalScreen} />
      <HomeStack.Screen name="HistoricoFinanceiro" component={HistoricoFinanceiroScreen} />
      <HomeStack.Screen name="ScanQRAula" component={ScanQRAulaScreen} />
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
      <FeedStack.Screen name="Stories">
        {(props: any) => <StoriesScreen {...props} />}
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

function LojaNavigator() {
  return (
    <LojaStack.Navigator screenOptions={stackOptions}>
      <LojaStack.Screen name="LojaMain" component={LojaScreen} />
      <LojaStack.Screen name="LojaCategoria" component={LojaCategoriaScreen} />
      <LojaStack.Screen name="LojaProdutoDetalhe" component={LojaProdutoDetalheScreen} />
    </LojaStack.Navigator>
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
      <MenuStack.Screen name="Agua" component={AguaScreen} />
      <MenuStack.Screen name="Jejum" component={JejumScreen} />
      <MenuStack.Screen name="Receitas" component={ReceitasScreen} />
      <MenuStack.Screen name="DiarioAlimentar" component={DiarioAlimentarScreen} />
      <MenuStack.Screen name="QRCode" component={QRCodeScreen} />
      <MenuStack.Screen name="Comparar" component={CompararScreen} />
      <MenuStack.Screen name="Missoes" component={MissoesScreen} />
      <MenuStack.Screen name="Ligas" component={LigasScreen} />
      <MenuStack.Screen name="Periodizacao" component={PeriodizacaoScreen} />
      <MenuStack.Screen name="Scanner2" component={ScannerScreen} />
      <MenuStack.Screen name="LGPD" component={LGPDScreen} />
      <MenuStack.Screen name="Relatorio" component={RelatorioScreen} />
      <MenuStack.Screen name="ListaCompras" component={ListaComprasScreen} />
      <MenuStack.Screen name="ScanQRAula" component={ScanQRAulaScreen} />
      <MenuStack.Screen name="IndicarAmigos" component={IndicarAmigosScreen} />
      <MenuStack.Screen name="HistoricoAvaliacoes" component={HistoricoAvaliacoesScreen} />
    </MenuStack.Navigator>
  );
}

// Professor stack navigators
function MinhasAulasNavigator() {
  return (
    <MinhasAulasStack.Navigator screenOptions={stackOptions}>
      <MinhasAulasStack.Screen name="MinhasAulasMain" component={MinhasAulasScreen} />
      <MinhasAulasStack.Screen name="AulaFinalizada" component={AulaFinalizadaScreen} />
    </MinhasAulasStack.Navigator>
  );
}

function PresencaNavigator() {
  return (
    <PresencaStack.Navigator screenOptions={stackOptions}>
      <PresencaStack.Screen name="AulaAtivaMain" component={AulaAtivaScreen} />
      <PresencaStack.Screen name="ScanQRAula" component={ScanQRAulaScreen} />
    </PresencaStack.Navigator>
  );
}

function HistoricoNavigator() {
  return (
    <HistoricoStack.Navigator screenOptions={stackOptions}>
      <HistoricoStack.Screen name="HistoricoTreinoMain" component={HistoricoTreinoScreen} />
    </HistoricoStack.Navigator>
  );
}

function AgendaProfNavigator() {
  return (
    <AgendaProfStack.Navigator screenOptions={stackOptions}>
      <AgendaProfStack.Screen name="AgendamentoMain" component={AgendamentoScreen} />
      <AgendaProfStack.Screen name="AgendamentoPersonal" component={AgendamentoPersonalScreen} />
    </AgendaProfStack.Navigator>
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
    Loja: '🛒',
    'Minhas Aulas': '📋',
    'Presença': '✅',
    'Histórico': '📊',
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

const tabScreenOptions = ({ route }: { route: any }) => ({
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
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <TabIcon name={route.name} focused={focused} />
  ),
});

function AlunoTabs() {
  return (
    <AlunoTab.Navigator screenOptions={tabScreenOptions}>
      <AlunoTab.Screen name="Home" component={HomeNavigator} />
      <AlunoTab.Screen name="Feed" component={FeedNavigator} />
      <AlunoTab.Screen
        name="Treino"
        component={TreinoNavigator}
        options={{ tabBarLabel: '' }}
      />
      <AlunoTab.Screen name="Loja" component={LojaNavigator} />
      <AlunoTab.Screen name="Menu" component={MenuNavigator} />
    </AlunoTab.Navigator>
  );
}

function ProfessorTabs() {
  return (
    <ProfessorTab.Navigator screenOptions={tabScreenOptions}>
      <ProfessorTab.Screen name="Minhas Aulas" component={MinhasAulasNavigator} />
      <ProfessorTab.Screen name="Presença" component={PresencaNavigator} />
      <ProfessorTab.Screen name="Histórico" component={HistoricoNavigator} />
      <ProfessorTab.Screen name="Agenda" component={AgendaProfNavigator} />
      <ProfessorTab.Screen name="Menu" component={MenuNavigator} />
    </ProfessorTab.Navigator>
  );
}

export default function AppNavigator() {
  const { currentMode } = useModeStore();

  if (currentMode === 'profissional') {
    return <ProfessorTabs />;
  }

  return <AlunoTabs />;
}
