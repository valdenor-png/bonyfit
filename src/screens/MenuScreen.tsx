import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';
import ScreenBackground from '../components/ScreenBackground';
import { useModeStore } from '../stores/modeStore';
import { useAuth } from '../hooks/useAuth';
import { useVip } from '../hooks/useVip';
import { useRoleStore } from '../stores/roleStore';

interface Props {
  navigation: any;
}

interface MenuItem {
  icon: string;
  label: string;
  sub?: string;
  screen: string;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Treino',
    items: [
      { icon: '📋', label: 'Treinos prontos', sub: 'Hipertrofia, emagrecimento, funcional', screen: 'TreinosProntos' },
      { icon: '📊', label: 'Histórico de treinos', sub: 'Seus treinos anteriores', screen: 'HistoricoTreino' },
      { icon: '📅', label: 'Frequência', sub: 'Calendário de presença', screen: 'Frequencia' },
      { icon: '📆', label: 'Periodização', sub: 'Mesociclo e fases do treino', screen: 'Periodizacao' },
      { icon: '📈', label: 'Progressão de Carga', sub: 'Evolução e sugestões', screen: 'ProgressaoCarga' },
    ],
  },
  {
    title: 'Ranking e gamificação',
    items: [
      { icon: '🏆', label: 'Ranking', sub: 'Sua posição entre os alunos', screen: 'Ranking' },
      { icon: '⚔', label: 'Ligas', sub: 'Competição semanal entre alunos', screen: 'Ligas' },
      { icon: '🎯', label: 'Desafios', sub: 'Desafios entre alunos e unidades', screen: 'Desafios' },
      { icon: '📌', label: 'Missões da semana', sub: 'Complete missões e ganhe XP', screen: 'Missoes' },
      { icon: '🎁', label: 'Recompensas', sub: 'Troque pontos por prêmios', screen: 'Recompensas' },
    ],
  },
  {
    title: 'Social',
    items: [
      { icon: '👥', label: 'Grupos', sub: 'Comunidades por afinidade', screen: 'Grupos' },
      { icon: '📊', label: 'Comparar progresso', sub: 'Compare com um amigo', screen: 'Comparar' },
      { icon: '📱', label: 'QR Code amigos', sub: 'Adicionar amigos por QR', screen: 'QRCode' },
      { icon: '🎁', label: 'Indicar amigos', sub: 'Ganhe pontos por indicação', screen: 'IndicarAmigos' },
    ],
  },
  {
    title: 'Saúde',
    items: [
      { icon: '📝', label: 'Anamnese', sub: 'Questionário de saúde', screen: 'Anamnese' },
      { icon: '📐', label: 'Avaliação física', sub: 'Medidas, composição, fotos', screen: 'AvaliacaoFisica' },
      { icon: '⚖', label: 'Peso', sub: 'Acompanhamento de peso', screen: 'Peso' },
      { icon: '📄', label: 'Relatório mensal', sub: 'Resumo em PDF', screen: 'Relatorio' },
      { icon: '📋', label: 'Minhas avaliações', sub: 'Histórico de reavaliações', screen: 'HistoricoAvaliacoes' },
    ],
  },
  {
    title: 'Academia',
    items: [
      { icon: '👨‍🏫', label: 'Personal trainers', sub: 'Quem está no salão agora', screen: 'Personal' },
      { icon: '🏋', label: 'Aulas coletivas', sub: 'Spinning, yoga, HIIT...', screen: 'Aulas' },
      { icon: '🎥', label: 'Aulas online', sub: 'Treinos em vídeo', screen: 'AulasOnline' },
      { icon: '📷', label: 'Escanear QR Aula', sub: 'Check-in em aula coletiva', screen: 'ScanQRAula' },
    ],
  },
  {
    title: 'Ajuda e dados',
    items: [
      { icon: '❓', label: 'Suporte', sub: 'FAQ e atendimento', screen: 'Suporte' },
      { icon: '🔒', label: 'LGPD e privacidade', sub: 'Exportar dados, excluir conta', screen: 'LGPD' },
    ],
  },
];

export default function MenuScreen({ navigation }: Props) {
  const { currentMode, toggleMode } = useModeStore();
  const { user, podeTrocarModo, cargoSlug } = useAuth();
  const { isVip } = useVip(user?.id);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const VIP_ITEMS: MenuItem[] = [
    { icon: '\uD83D\uDC8E', label: 'Escolher Personal', sub: 'Seu personal exclusivo VIP', screen: 'EscolherPersonal' },
    { icon: '\uD83D\uDCCB', label: 'Agendar Avaliacao', sub: 'Solicitar avaliacao fisica', screen: 'AgendarAvaliacao' },
  ];

  return (
    <ScreenBackground>
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Skull size={28} color={colors.orange} />
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      {/* Mode badge */}
      <View style={styles.modeBadgeRow}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {currentMode === 'aluno' ? '\uD83D\uDC64 Modo Aluno' : '\uD83C\uDFCB\uFE0F Modo Profissional'}
          </Text>
        </View>
      </View>

      {/* Switch role - show if user has multiple roles */}
      {useRoleStore.getState().userRoles.length > 1 && (
        <View style={[styles.section, { marginTop: spacing.md }]}>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                useRoleStore.getState().reset();
                navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' as never }] });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrapper}>
                <Text style={styles.menuIcon}>{'\uD83D\uDD04'}</Text>
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Trocar cargo</Text>
                <Text style={styles.menuSub}>Voltar à tela de seleção de cargo</Text>
              </View>
              <Text style={styles.chevron}>{'\u203A'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* VIP Section - only show if user is VIP */}
      {isVip && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VIP</Text>
          <View style={styles.sectionCard}>
            {VIP_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.screen}
                style={[
                  styles.menuItem,
                  i < VIP_ITEMS.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrapper}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                </View>
                <Text style={styles.chevron}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.screen}
                style={[
                  styles.menuItem,
                  i < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrapper}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.version}>Bony Fit App v1.0.0</Text>
    </ScrollView>
    </Animated.View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text },
  modeBadgeRow: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  modeBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(242,101,34,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 20, textAlign: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text },
  menuSub: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 20, color: 'rgba(255,255,255,0.20)' },
  version: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
