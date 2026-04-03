import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';

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
    ],
  },
  {
    title: 'Ranking e recompensas',
    items: [
      { icon: '🏆', label: 'Ranking', sub: 'Sua posição entre os alunos', screen: 'Ranking' },
      { icon: '🎁', label: 'Recompensas', sub: 'Troque pontos por prêmios', screen: 'Recompensas' },
      { icon: '🎯', label: 'Desafios', sub: 'Desafios entre alunos e unidades', screen: 'Desafios' },
    ],
  },
  {
    title: 'Social',
    items: [
      { icon: '👥', label: 'Grupos', sub: 'Comunidades por afinidade', screen: 'Grupos' },
    ],
  },
  {
    title: 'Saúde e nutrição',
    items: [
      { icon: '📝', label: 'Anamnese', sub: 'Questionário de saúde', screen: 'Anamnese' },
      { icon: '📐', label: 'Avaliação física', sub: 'Medidas, composição, fotos', screen: 'AvaliacaoFisica' },
      { icon: '⚖', label: 'Peso', sub: 'Acompanhamento de peso', screen: 'Peso' },
      { icon: '🥗', label: 'Nutrição', sub: 'Plano alimentar e calorias', screen: 'Nutricao' },
    ],
  },
  {
    title: 'Academia',
    items: [
      { icon: '👨‍🏫', label: 'Personal trainers', sub: 'Quem está no salão agora', screen: 'Personal' },
      { icon: '🏋', label: 'Aulas coletivas', sub: 'Spinning, yoga, HIIT...', screen: 'Aulas' },
      { icon: '🎥', label: 'Aulas online', sub: 'Treinos em vídeo', screen: 'AulasOnline' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { icon: '❓', label: 'Suporte', sub: 'FAQ e atendimento', screen: 'Suporte' },
    ],
  },
];

export default function MenuScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Skull size={28} color={colors.orange} />
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

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
                <Text style={styles.menuIcon}>{item.icon}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
    backgroundColor: colors.card,
    borderRadius: radius.xl,
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
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text },
  menuSub: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 20, color: colors.textMuted },
  version: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
