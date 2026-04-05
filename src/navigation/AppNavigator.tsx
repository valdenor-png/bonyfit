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
import ComentariosScreen from '../screens/ComentariosScreen';
import CarrinhoScreen from '../screens/loja/CarrinhoScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import ExerciseSearchScreen from '../screens/ExerciseSearchScreen';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';
import WorkoutProgressScreen from '../screens/WorkoutProgressScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import MeasurementsScreen from '../screens/MeasurementsScreen';

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

const stackOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.bg, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0.5, borderBottomColor: colors.elevated },
  headerTintColor: colors.orange,
  headerTitleStyle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: colors.bg },
} as const;

// For root screens in each tab (no header, tab handles it)
const rootStackOptions = { headerShown: false, cardStyle: { backgroundColor: colors.bg } } as const;

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="PerfilPessoal" component={PerfilPessoalScreen} options={{ title: 'Meu Perfil' }} />
      <HomeStack.Screen name="HistoricoFinanceiro" component={HistoricoFinanceiroScreen} options={{ title: 'Financeiro' }} />
      <HomeStack.Screen name="ScanQRAula" component={ScanQRAulaScreen} options={{ title: 'Escanear QR' }} />
    </HomeStack.Navigator>
  );
}

function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={stackOptions}>
      <FeedStack.Screen name="FeedMain" component={FeedScreen} options={{ headerShown: false }} />
      <FeedStack.Screen name="ProfileView" options={{ title: 'Perfil' }}>
        {(props: any) => <ProfileViewScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="Chat" options={{ title: '' }}>
        {(props: any) => <ChatScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="Stories" options={{ headerShown: false }}>
        {(props: any) => <StoriesScreen {...props} />}
      </FeedStack.Screen>
      <FeedStack.Screen name="Comentarios" component={ComentariosScreen} options={{ title: 'Comentários' }} />
    </FeedStack.Navigator>
  );
}

function TreinoNavigator() {
  return (
    <TreinoStack.Navigator screenOptions={stackOptions}>
      <TreinoStack.Screen name="TreinoMain" component={ActiveWorkoutScreen} options={{ headerShown: false }} />
      <TreinoStack.Screen name="ExerciseSearch" component={ExerciseSearchScreen} options={{ title: 'Exercícios' }} />
      <TreinoStack.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Meus Treinos' }} />
    </TreinoStack.Navigator>
  );
}

function LojaNavigator() {
  return (
    <LojaStack.Navigator screenOptions={stackOptions}>
      <LojaStack.Screen name="LojaMain" component={LojaScreen} options={{ headerShown: false }} />
      <LojaStack.Screen name="LojaCategoria" component={LojaCategoriaScreen} options={{ title: '' }} />
      <LojaStack.Screen name="LojaProdutoDetalhe" component={LojaProdutoDetalheScreen} options={{ title: '' }} />
      <LojaStack.Screen name="Carrinho" component={CarrinhoScreen} options={{ title: 'Carrinho' }} />
    </LojaStack.Navigator>
  );
}

function MenuNavigator() {
  return (
    <MenuStack.Navigator screenOptions={stackOptions}>
      <MenuStack.Screen name="MenuMain" component={MenuScreen} options={{ headerShown: false }} />
      <MenuStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <MenuStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
      <MenuStack.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
      <MenuStack.Screen name="Recompensas" component={RecompensasScreen} options={{ title: 'Recompensas' }} />
      <MenuStack.Screen name="TreinosProntos" component={TreinosProntosScreen} options={{ title: 'Treinos Prontos' }} />
      <MenuStack.Screen name="HistoricoTreino" component={HistoricoTreinoScreen} options={{ title: 'Histórico' }} />
      <MenuStack.Screen name="Personal" component={PersonalScreen} options={{ title: 'Personal Trainers' }} />
      <MenuStack.Screen name="Grupos" component={GruposScreen} options={{ title: 'Grupos' }} />
      <MenuStack.Screen name="Desafios" component={DesafiosScreen} options={{ title: 'Desafios' }} />
      <MenuStack.Screen name="HistoricoFinanceiro" component={HistoricoFinanceiroScreen} options={{ title: 'Financeiro' }} />
      <MenuStack.Screen name="Frequencia" component={FrequenciaScreen} options={{ title: 'Frequência' }} />
      <MenuStack.Screen name="Anamnese" component={AnamneseScreen} options={{ title: 'Anamnese' }} />
      <MenuStack.Screen name="AvaliacaoFisica" component={AvaliacaoFisicaScreen} options={{ title: 'Avaliação Física' }} />
      <MenuStack.Screen name="Peso" component={PesoScreen} options={{ title: 'Peso' }} />
      <MenuStack.Screen name="Nutricao" component={NutricaoScreen} options={{ title: 'Nutrição' }} />
      <MenuStack.Screen name="AulasOnline" component={AulasOnlineScreen} options={{ title: 'Aulas Online' }} />
      <MenuStack.Screen name="Suporte" component={SuporteScreen} options={{ title: 'Suporte' }} />
      <MenuStack.Screen name="Aulas" component={AulasScreen} options={{ title: 'Aulas Coletivas' }} />
      <MenuStack.Screen name="Agua" component={AguaScreen} options={{ title: 'Hidratação' }} />
      <MenuStack.Screen name="Jejum" component={JejumScreen} options={{ title: 'Jejum' }} />
      <MenuStack.Screen name="Receitas" component={ReceitasScreen} options={{ title: 'Receitas' }} />
      <MenuStack.Screen name="DiarioAlimentar" component={DiarioAlimentarScreen} options={{ title: 'Diário Alimentar' }} />
      <MenuStack.Screen name="QRCode" component={QRCodeScreen} options={{ title: 'QR Code' }} />
      <MenuStack.Screen name="Comparar" component={CompararScreen} options={{ title: 'Comparar' }} />
      <MenuStack.Screen name="Missoes" component={MissoesScreen} options={{ title: 'Missões' }} />
      <MenuStack.Screen name="Ligas" component={LigasScreen} options={{ title: 'Ligas' }} />
      <MenuStack.Screen name="Periodizacao" component={PeriodizacaoScreen} options={{ title: 'Periodização' }} />
      <MenuStack.Screen name="Scanner2" component={ScannerScreen} options={{ title: 'Scanner' }} />
      <MenuStack.Screen name="LGPD" component={LGPDScreen} options={{ title: 'Dados e Privacidade' }} />
      <MenuStack.Screen name="Relatorio" component={RelatorioScreen} options={{ title: 'Relatório' }} />
      <MenuStack.Screen name="ListaCompras" component={ListaComprasScreen} options={{ title: 'Lista de Compras' }} />
      <MenuStack.Screen name="ScanQRAula" component={ScanQRAulaScreen} options={{ title: 'Escanear QR' }} />
      <MenuStack.Screen name="IndicarAmigos" component={IndicarAmigosScreen} options={{ title: 'Indicar Amigos' }} />
      <MenuStack.Screen name="HistoricoAvaliacoes" component={HistoricoAvaliacoesScreen} options={{ title: 'Avaliações' }} />
      <MenuStack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: 'Histórico de Treinos' }} />
      <MenuStack.Screen name="WorkoutProgress" component={WorkoutProgressScreen} options={{ title: 'Progresso' }} />
      <MenuStack.Screen name="Measurements" component={MeasurementsScreen} options={{ title: 'Medidas Corporais' }} />
      <MenuStack.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Meus Treinos' }} />
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
