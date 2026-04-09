import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Button from '../../components/Button';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

// --- TYPES ---

interface Attendee {
  id: string;
  nome: string;
  initials: string;
  escaneouAt: string;
  removido: boolean;
  aluno_id?: string;
}

// --- MOCK DATA (fallback) ---

const MOCK_ATTENDEES: Attendee[] = [
  { id: 'a1', nome: 'Carlos Pereira', initials: 'CP', escaneouAt: '09:02', removido: false },
  { id: 'a2', nome: 'Juliana Ferreira', initials: 'JF', escaneouAt: '09:03', removido: false },
  { id: 'a3', nome: 'Ana Maria Santos', initials: 'AM', escaneouAt: '09:04', removido: false },
  { id: 'a4', nome: 'Roberto Lima', initials: 'RL', escaneouAt: '09:05', removido: false },
  { id: 'a5', nome: 'Patricia Souza', initials: 'PS', escaneouAt: '09:06', removido: false },
  { id: 'a6', nome: 'Fernando Costa', initials: 'FC', escaneouAt: '09:07', removido: true },
  { id: 'a7', nome: 'Gabriela Oliveira', initials: 'GO', escaneouAt: '09:08', removido: false },
  { id: 'a8', nome: 'Lucas Mendes', initials: 'LM', escaneouAt: '09:10', removido: false },
  { id: 'a9', nome: 'Mariana Alves', initials: 'MA', escaneouAt: '09:11', removido: false },
];

const QR_WINDOW_MINUTES = 15;

// --- HELPERS ---

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTimeShort(isoStr: string | null): string {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// QR grid pattern placeholder
function QRPattern() {
  const pattern = [
    [1,1,1,0,1,0,1,1,1],
    [1,0,1,0,0,0,1,0,1],
    [1,1,1,0,1,0,1,1,1],
    [0,0,0,0,1,0,0,0,0],
    [1,0,1,1,0,1,1,0,1],
    [0,0,0,0,1,0,0,0,0],
    [1,1,1,0,0,0,1,1,1],
    [1,0,1,0,1,0,1,0,1],
    [1,1,1,0,1,0,1,1,1],
  ];

  return (
    <View style={styles.qrGrid}>
      {pattern.map((row, ri) => (
        <View key={ri} style={styles.qrRow}>
          {row.map((cell, ci) => (
            <View
              key={ci}
              style={[
                styles.qrCell,
                { backgroundColor: cell ? '#000000' : '#FFFFFF' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// --- COMPONENT ---

interface Props {
  navigation?: any;
  route?: any;
}

export default function AulaAtivaScreen({ navigation, route }: Props) {
  // Route params from MinhasAulasScreen
  const sessionId = route?.params?.sessionId;
  const qrToken = route?.params?.qrToken ?? 'BONYFIT_AULA_DEMO';
  const modalidadeNome = route?.params?.modalidadeNome ?? 'Funcional';
  const modalidadeIcone = route?.params?.modalidadeIcone ?? '\u{1F3CB}\u{FE0F}';
  const pontosAula = route?.params?.pontosAula ?? 15;

  const [elapsed, setElapsed] = useState(0);
  const [qrTimeLeft, setQrTimeLeft] = useState(QR_WINDOW_MINUTES * 60);
  const [attendees, setAttendees] = useState<Attendee[]>(sessionId ? [] : MOCK_ATTENDEES);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const user = useAuth((s) => s.user);

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
      setQrTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Load attendance from Supabase
  const loadAttendees = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase
        .from('aula_presencas')
        .select('*, users!aluno_id(name, avatar_url)')
        .eq('sessao_id', sessionId)
        .eq('removido', false);

      if (error) throw error;
      if (data) {
        const mapped: Attendee[] = data.map((p: any) => ({
          id: p.id,
          nome: p.users?.name ?? 'Aluno',
          initials: getInitials(p.users?.name ?? 'A'),
          escaneouAt: formatTimeShort(p.escaneou_at),
          removido: p.removido ?? false,
          aluno_id: p.aluno_id,
        }));
        setAttendees(mapped);
      }
    } catch (err) {
      console.warn('Error loading attendees:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  // Realtime subscription for attendance changes
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`aula_presencas_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aula_presencas',
          filter: `sessao_id=eq.${sessionId}`,
        },
        () => {
          // Reload full list on any change
          loadAttendees();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, loadAttendees]);

  const qrOpen = qrTimeLeft > 0;
  const qrMinLeft = Math.ceil(qrTimeLeft / 60);
  const activeAttendees = attendees.filter((a) => !a.removido);
  const presentCount = activeAttendees.length;

  const handleRemove = (presencaId: string) => {
    Alert.alert('Remover aluno?', 'O aluno sera removido da lista de presenca.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          if (sessionId) {
            try {
              const { error } = await supabase
                .from('aula_presencas')
                .update({ removido: true, removido_at: new Date().toISOString() })
                .eq('id', presencaId);
              if (error) throw error;
            } catch (err) {
              console.warn('Error removing attendee:', err);
              Alert.alert('Erro', 'Nao foi possivel remover o aluno.');
              return;
            }
          }
          // Update local state immediately
          setAttendees((prev) =>
            prev.map((a) => (a.id === presencaId ? { ...a, removido: true } : a)),
          );
        },
      },
    ]);
  };

  const handleFinalize = () => {
    Alert.alert(
      'Finalizar aula?',
      `Conceder ${pontosAula} pontos para ${presentCount} alunos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'default',
          onPress: async () => {
            if (!sessionId) return;
            try {
              // 1. Update session status
              const { error: sessError } = await supabase
                .from('aula_sessoes')
                .update({
                  status: 'finalizada',
                  horario_fim: new Date().toISOString(),
                })
                .eq('id', sessionId);
              if (sessError) throw sessError;

              // 2. Mark all non-removed presencas as present + grant points
              const { error: presError } = await supabase
                .from('aula_presencas')
                .update({
                  presente_no_fim: true,
                  pontos_concedidos: pontosAula,
                })
                .eq('sessao_id', sessionId)
                .eq('removido', false);
              if (presError) throw presError;

              // 3. Add points to each present student
              const presentStudents = attendees.filter((a) => !a.removido && a.aluno_id);
              for (const student of presentStudents) {
                try {
                  // TODO: mover pra Edge Function — gamificação não deve rodar no client
                  const { data: userData, error: userErr } = await supabase
                    .from('public_user_profile')
                    .select('total_points')
                    .eq('id', student.aluno_id)
                    .single();

                  if (userErr) {
                    console.warn('Error fetching user points:', userErr);
                    continue;
                  }

                  const currentPoints = userData?.total_points ?? 0;
                  // TODO: mover pra Edge Function — gamificação não deve rodar no client
                  const { error: updateErr } = await supabase
                    .from('users')
                    .update({ total_points: currentPoints + pontosAula })
                    .eq('id', student.aluno_id);

                  if (updateErr) {
                    console.warn('Error updating user points:', updateErr);
                  }
                } catch (innerErr) {
                  console.warn('Error updating student points:', innerErr);
                }
              }

              // 4. Navigate to summary
              Alert.alert(
                'Aula Finalizada!',
                `${presentCount} alunos receberam ${pontosAula} pontos cada.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation?.navigate?.('Minhas Aulas', {
                        screen: 'AulaFinalizada',
                      });
                    },
                  },
                ],
              );
            } catch (err) {
              console.warn('Error finalizing class:', err);
              Alert.alert('Erro', 'Nao foi possivel finalizar a aula. Tente novamente.');
            }
          },
        },
      ],
    );
  };

  const renderAttendee = ({ item }: { item: Attendee }) => (
    <View style={[styles.attendeeRow, item.removido && styles.attendeeRowRemoved]}>
      <View style={[styles.attendeeAvatar, item.removido && styles.attendeeAvatarRemoved]}>
        <Text style={styles.attendeeInitials}>{item.initials}</Text>
      </View>
      <View style={styles.attendeeInfo}>
        <Text
          style={[
            styles.attendeeName,
            item.removido && styles.attendeeNameRemoved,
          ]}
        >
          {item.nome}
        </Text>
        <Text style={styles.attendeeTime}>{item.escaneouAt}</Text>
      </View>
      {item.removido ? (
        <View style={styles.removedBadge}>
          <Text style={styles.removedBadgeText}>Removido</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => handleRemove(item.id)}>
          <Text style={styles.removeBtn}>Remover</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top: Modalidade + Timer */}
      <View style={styles.topSection}>
        <View style={styles.modalidadeRow}>
          <Text style={styles.modalidadeIcon}>{modalidadeIcone}</Text>
          <Text style={styles.modalidadeName}>{modalidadeNome}</Text>
        </View>
        <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
      </View>

      {/* QR Code area */}
      <View style={styles.qrSection}>
        <View style={styles.qrWrapper}>
          <Text style={styles.qrTitle}>BONY FIT AULA</Text>
          <QRPattern />
        </View>
        {/* Show QR token so students can type it manually */}
        <View style={styles.qrTokenBox}>
          <Text style={styles.qrTokenLabel}>Codigo da aula:</Text>
          <Text style={styles.qrTokenText} selectable>{qrToken}</Text>
        </View>
        <Text style={styles.qrHint}>Mostre este QR ou compartilhe o codigo</Text>
        {qrOpen ? (
          <Text style={styles.qrWindowOpen}>
            Aceitando check-ins por mais {qrMinLeft}min
          </Text>
        ) : (
          <Text style={styles.qrWindowClosed}>Janela encerrada</Text>
        )}
      </View>

      {/* Attendance list */}
      <View style={styles.attendanceHeader}>
        <Text style={styles.attendanceTitle}>
          Presenca ({presentCount} alunos)
        </Text>
      </View>

      <FlatList
        data={attendees}
        keyExtractor={(item) => item.id}
        renderItem={renderAttendee}
        contentContainerStyle={styles.attendanceList}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        <Button title="Finalizar Aula" onPress={handleFinalize} />
      </View>
    </View>
  );
}

// --- STYLES ---

const QR_SIZE = 220;
const QR_CELL_SIZE = Math.floor((QR_SIZE - 40) / 9);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Top section
  topSection: {
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  modalidadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalidadeIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  modalidadeName: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  timer: {
    fontSize: 28,
    fontFamily: fonts.numbersExtraBold,
    color: colors.text,
  },
  // QR section
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  qrWrapper: {
    width: QR_SIZE,
    height: QR_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  qrTitle: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: '#000000',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  qrGrid: {
    gap: 1,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 1,
  },
  qrCell: {
    width: QR_CELL_SIZE,
    height: QR_CELL_SIZE,
    borderRadius: 2,
  },
  qrTokenBox: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  qrTokenLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  qrTokenText: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
    letterSpacing: 0.5,
  },
  qrHint: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  qrWindowOpen: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
    marginTop: spacing.xs,
  },
  qrWindowClosed: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  // Attendance
  attendanceHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  attendanceTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  attendanceList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  attendeeRowRemoved: {
    opacity: 0.5,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  attendeeAvatarRemoved: {
    backgroundColor: colors.elevated,
  },
  attendeeInitials: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  attendeeNameRemoved: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  attendeeTime: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.danger,
  },
  removedBadge: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removedBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.danger,
  },
  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 34,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
  },
});
