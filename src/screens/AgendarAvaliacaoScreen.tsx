import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useVip } from '../hooks/useVip';

interface Agendamento {
  id: string;
  status: 'solicitado' | 'agendado' | 'cancelado' | 'concluido';
  observacoes?: string;
  data_agendada?: string;
  personal_nome?: string;
  created_at: string;
}

export default function AgendarAvaliacaoScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { isVip, temAvaliacaoMensal } = useVip(user?.id);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [diasDesdeUltima, setDiasDesdeUltima] = useState<number | null>(null);

  useEffect(() => {
    loadAgendamentos();
    if (isVip) loadUltimaAvaliacao();
  }, [user?.id, isVip]);

  const loadAgendamentos = async () => {
    if (!user?.id) {
      setLoadingAgendamentos(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('agendamento_avaliacoes')
        .select('id, status, observacoes, data_agendada, personal_nome, created_at')
        .eq('aluno_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setAgendamentos(data as Agendamento[]);
    } catch {
      // silent
    } finally {
      setLoadingAgendamentos(false);
    }
  };

  const loadUltimaAvaliacao = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('agendamento_avaliacoes')
        .select('created_at')
        .eq('aluno_id', user.id)
        .eq('status', 'concluido')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.created_at) {
        const diff = Math.floor(
          (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24),
        );
        setDiasDesdeUltima(diff);
      }
    } catch {
      // No previous evaluation
    }
  };

  const handleSolicitar = async () => {
    if (!user?.id) return;
    setEnviando(true);
    try {
      const { error } = await supabase.from('agendamento_avaliacoes').insert({
        aluno_id: user.id,
        status: 'solicitado',
        observacoes: observacoes.trim() || null,
      });
      if (error) throw error;
      Alert.alert('Solicitacao enviada!', 'A recepcao vai confirmar o horario e o personal.');
      setObservacoes('');
      loadAgendamentos();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel enviar a solicitacao.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = (agendamento: Agendamento) => {
    Alert.alert('Cancelar solicitacao', 'Tem certeza que deseja cancelar?', [
      { text: 'Nao', style: 'cancel' },
      {
        text: 'Cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('agendamento_avaliacoes')
              .update({ status: 'cancelado' })
              .eq('id', agendamento.id);
            if (error) throw error;
            loadAgendamentos();
          } catch {
            Alert.alert('Erro', 'Nao foi possivel cancelar.');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solicitado':
        return colors.orange;
      case 'agendado':
        return colors.success;
      case 'cancelado':
        return colors.danger;
      case 'concluido':
        return colors.info;
      default:
        return '#666666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'solicitado':
        return 'Solicitado';
      case 'agendado':
        return 'Agendado';
      case 'cancelado':
        return 'Cancelado';
      case 'concluido':
        return 'Concluido';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  const renderAgendamento = ({ item }: { item: Agendamento }) => (
    <View style={styles.agendamentoCard}>
      <View style={styles.agendamentoRow}>
        <View style={styles.agendamentoInfo}>
          <Text style={styles.agendamentoDate}>
            {item.data_agendada ? formatDate(item.data_agendada) : 'Pendente'}
          </Text>
          {item.personal_nome && (
            <Text style={styles.agendamentoPersonal}>{item.personal_nome}</Text>
          )}
          {item.observacoes && (
            <Text style={styles.agendamentoObs} numberOfLines={1}>
              {item.observacoes}
            </Text>
          )}
        </View>

        <View style={styles.agendamentoRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '26' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>

          {(item.status === 'solicitado' || item.status === 'agendado') && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelar(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={colors.orange} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Solicitar Avaliacao</Text>

      {/* VIP monthly evaluation card */}
      {isVip && temAvaliacaoMensal && (
        <View style={styles.vipCard}>
          <View style={styles.vipCardHeader}>
            <Text style={styles.vipCardEmoji}>{'\uD83D\uDC8E'}</Text>
            <Text style={styles.vipCardTitle}>Avaliacao mensal</Text>
          </View>
          <Text style={styles.vipCardSub}>
            {diasDesdeUltima !== null
              ? `${diasDesdeUltima} dias desde a ultima avaliacao`
              : 'Nenhuma avaliacao registrada ainda'}
          </Text>
        </View>
      )}

      {/* Observacoes input */}
      <Text style={styles.inputLabel}>Observacoes (opcional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Ex: quero ver progresso do cutting..."
        placeholderTextColor="#666666"
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Info text */}
      <Text style={styles.infoText}>
        A recepcao vai confirmar o horario e o personal.
      </Text>

      {/* Solicitar button */}
      <TouchableOpacity
        style={[styles.solicitarBtn, enviando && styles.solicitarBtnDisabled]}
        onPress={handleSolicitar}
        activeOpacity={0.8}
        disabled={enviando}
      >
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.solicitarBtnText}>Solicitar Avaliacao</Text>
        )}
      </TouchableOpacity>

      {/* Minhas solicitacoes */}
      <Text style={styles.sectionTitle}>Minhas solicitacoes</Text>

      {loadingAgendamentos ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: spacing.lg }} />
      ) : agendamentos.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma solicitacao ainda.</Text>
      ) : (
        agendamentos.map((item) => (
          <View key={item.id}>{renderAgendamento({ item })}</View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Back
  backBtn: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },

  // Header
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.xxl,
  },

  // VIP card
  vipCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  vipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  vipCardEmoji: {
    fontSize: 18,
  },
  vipCardTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  vipCardSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#999999',
  },

  // Input
  inputLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.lg,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14,
    minHeight: 80,
    marginBottom: spacing.md,
  },

  // Info
  infoText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#666666',
    marginBottom: spacing.lg,
  },

  // Solicitar button
  solicitarBtn: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  solicitarBtnDisabled: {
    opacity: 0.6,
  },
  solicitarBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },

  // Agendamento card
  agendamentoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  agendamentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  agendamentoInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  agendamentoDate: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  agendamentoPersonal: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#999999',
    marginTop: 2,
  },
  agendamentoObs: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: '#666666',
    marginTop: 4,
  },
  agendamentoRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
  },

  // Empty
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#666666',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
