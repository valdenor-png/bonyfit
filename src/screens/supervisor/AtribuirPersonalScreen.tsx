import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useAuth } from '../../hooks/useAuth';
import { useSupervisorStore } from '../../stores/supervisorStore';
import type { PersonalComCarga } from '../../types/supervisor';

const MOCK_PERSONAIS: PersonalComCarga[] = [
  { id: 'p1', name: 'Pedro Coach', avatar_url: null, bio: 'Especialista em hipertrofia', alunos_count: 12, horario: '06:00 - 14:00', rating: 4.9 },
  { id: 'p2', name: 'Julia Trainer', avatar_url: null, bio: 'Funcional e crossfit', alunos_count: 8, horario: '08:00 - 16:00', rating: 4.7 },
  { id: 'p3', name: 'Marcos Fit', avatar_url: null, bio: 'Emagrecimento', alunos_count: 15, horario: '10:00 - 18:00', rating: 4.5 },
  { id: 'p4', name: 'Fernanda Strong', avatar_url: null, bio: 'Powerlifting', alunos_count: 5, horario: '06:00 - 14:00', rating: 4.8 },
  { id: 'p5', name: 'Ricardo Move', avatar_url: null, bio: 'Mobilidade e reabilitacao', alunos_count: 18, horario: '14:00 - 22:00', rating: 4.6 },
];

function Avatar({ uri, size = 48 }: { uri: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, marginRight: spacing.md }} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>?</Text>
    </View>
  );
}

export default function AtribuirPersonalScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { solicitacaoId, alunoNome } = route.params || {};

  const personaisDaUnidade = useSupervisorStore((s) => s.personaisDaUnidade);
  const atribuirPersonal = useSupervisorStore((s) => s.atribuirPersonal);

  const personais = personaisDaUnidade.length > 0 ? personaisDaUnidade : MOCK_PERSONAIS;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const minAlunos = Math.min(...personais.map((p) => p.alunos_count));

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await atribuirPersonal(solicitacaoId, selectedId, user?.id || '');
      Alert.alert('Sucesso', 'Personal atribuido com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atribuir o personal.');
    }
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Atribuir Personal para {alunoNome || 'Aluno'}</Text>

      <FlatList
        data={personais}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedId === item.id;
          const isLeast = item.alunos_count === minAlunos;
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedId(item.id)}
              activeOpacity={0.7}
            >
              <Avatar uri={item.avatar_url} />
              <View style={styles.cardContent}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {isLeast && (
                    <View style={styles.leastBadge}>
                      <Text style={styles.leastBadgeText}>Menos alunos</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardBio}>{item.bio}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{item.alunos_count} alunos</Text>
                  <Text style={styles.infoText}>{item.horario || '06:00 - 22:00'}</Text>
                  <Text style={styles.ratingText}>★ {item.rating ?? 4.5}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedId && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedId || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.confirmBtnText}>CONFIRMAR ATRIBUICAO</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.orange,
  },
  avatarPlaceholder: {
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textMuted,
  },
  cardContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardName: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  leastBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leastBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.text,
  },
  cardBio: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  ratingText: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: colors.orange,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  confirmBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: 1,
  },
});
