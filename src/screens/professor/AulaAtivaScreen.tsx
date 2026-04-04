import React, { useState, useEffect, useRef } from 'react';
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

// --- TYPES ---

interface Attendee {
  id: string;
  nome: string;
  initials: string;
  escaneouAt: string;
  removido: boolean;
}

// --- MOCK DATA ---

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
}

export default function AulaAtivaScreen({ navigation }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [qrTimeLeft, setQrTimeLeft] = useState(QR_WINDOW_MINUTES * 60);
  const [attendees, setAttendees] = useState<Attendee[]>(MOCK_ATTENDEES);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
      setQrTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const qrOpen = qrTimeLeft > 0;
  const qrMinLeft = Math.ceil(qrTimeLeft / 60);
  const activeAttendees = attendees.filter((a) => !a.removido);
  const presentCount = activeAttendees.length;

  const handleRemove = (id: string) => {
    Alert.alert('Remover aluno?', 'O aluno sera removido da lista de presenca.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          setAttendees((prev) =>
            prev.map((a) => (a.id === id ? { ...a, removido: true } : a)),
          );
        },
      },
    ]);
  };

  const handleFinalize = () => {
    Alert.alert(
      'Finalizar aula?',
      `Conceder pontos para ${presentCount} alunos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', style: 'default', onPress: () => {} },
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
          <Text style={styles.modalidadeIcon}>🏋️</Text>
          <Text style={styles.modalidadeName}>Funcional</Text>
        </View>
        <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
      </View>

      {/* QR Code area */}
      <View style={styles.qrSection}>
        <View style={styles.qrWrapper}>
          <Text style={styles.qrTitle}>BONY FIT AULA</Text>
          <QRPattern />
        </View>
        <Text style={styles.qrHint}>Mostre este QR para os alunos</Text>
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
