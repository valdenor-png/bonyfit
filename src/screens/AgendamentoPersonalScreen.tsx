import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// --- HELPERS ---
const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function getNext7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// --- MOCK DATA ---
type Trainer = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatar: string; // initials placeholder
  availableSlots: Record<number, string[]>; // dayIndex -> times
};

const MOCK_TRAINERS: Trainer[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    specialty: 'Musculação & Hipertrofia',
    rating: 4.9,
    avatar: 'CS',
    availableSlots: {
      0: ['07:00', '08:00', '14:00', '15:00'],
      1: ['09:00', '10:00', '16:00'],
      2: ['07:00', '08:00', '14:00'],
      3: ['09:00', '10:00', '15:00', '16:00'],
      4: ['07:00', '08:00'],
      5: ['09:00', '10:00', '11:00'],
      6: [],
    },
  },
  {
    id: '2',
    name: 'Ana Oliveira',
    specialty: 'Funcional & HIIT',
    rating: 4.8,
    avatar: 'AO',
    availableSlots: {
      0: ['06:00', '07:00', '17:00', '18:00'],
      1: ['06:00', '07:00', '18:00', '19:00'],
      2: ['06:00', '17:00', '18:00', '19:00'],
      3: ['06:00', '07:00', '17:00'],
      4: ['06:00', '07:00', '18:00', '19:00'],
      5: ['08:00', '09:00'],
      6: [],
    },
  },
  {
    id: '3',
    name: 'Roberto Mendes',
    specialty: 'Emagrecimento & Condicionamento',
    rating: 4.7,
    avatar: 'RM',
    availableSlots: {
      0: ['10:00', '11:00', '14:00'],
      1: ['10:00', '11:00', '14:00', '15:00'],
      2: ['10:00', '14:00', '15:00'],
      3: ['10:00', '11:00'],
      4: ['10:00', '11:00', '14:00', '15:00'],
      5: ['10:00', '11:00'],
      6: ['09:00', '10:00'],
    },
  },
];

type Booking = {
  id: string;
  trainerName: string;
  date: string;
  time: string;
};

const MOCK_BOOKINGS: Booking[] = [
  { id: '1', trainerName: 'Carlos Silva', date: 'Amanhã', time: '08:00' },
];

// --- COMPONENT ---
export default function AgendamentoPersonalScreen() {
  const days = getNext7Days();
  const [step, setStep] = useState(1);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  const availableTimes = selectedTrainer
    ? selectedTrainer.availableSlots[selectedDayIdx] ?? []
    : [];

  const totalSlotsForTrainer = (trainer: Trainer): number => {
    return Object.values(trainer.availableSlots).reduce((sum, slots) => sum + slots.length, 0);
  };

  const handleSelectTrainer = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setSelectedDayIdx(0);
    setSelectedTime(null);
    setStep(2);
  };

  const handleSelectDay = (idx: number) => {
    setSelectedDayIdx(idx);
    setSelectedTime(null);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleConfirm = () => {
    if (!selectedTrainer || !selectedTime) return;
    const day = days[selectedDayIdx];
    const label = selectedDayIdx === 0 ? 'Hoje' : WEEKDAY_SHORT[day.getDay()];
    setBookings((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        trainerName: selectedTrainer.name,
        date: label,
        time: selectedTime,
      },
    ]);
    Alert.alert('Agendado!', `Sessão com ${selectedTrainer.name} confirmada.`);
    setStep(1);
    setSelectedTrainer(null);
    setSelectedTime(null);
  };

  const handleBack = () => {
    if (step === 3) {
      setSelectedTime(null);
      setStep(2);
    } else if (step === 2) {
      setSelectedTrainer(null);
      setStep(1);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.header}>Agendar com Personal</Text>

        {/* Step indicators */}
        <View style={styles.stepsRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>
                  {s}
                </Text>
              </View>
              <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
                {s === 1 ? 'Personal' : s === 2 ? 'Data' : 'Horário'}
              </Text>
            </View>
          ))}
        </View>

        {step > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
        )}

        {/* Step 1: Select trainer */}
        {step === 1 && (
          <View style={styles.stepContent}>
            {MOCK_TRAINERS.map((trainer) => (
              <TouchableOpacity
                key={trainer.id}
                style={styles.trainerCard}
                onPress={() => handleSelectTrainer(trainer)}
                activeOpacity={0.7}
              >
                <View style={styles.trainerAvatar}>
                  <Text style={styles.trainerAvatarText}>{trainer.avatar}</Text>
                </View>
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpecialty}>{trainer.specialty}</Text>
                  <View style={styles.trainerMeta}>
                    <Text style={styles.trainerRating}>★ {trainer.rating}</Text>
                    <Text style={styles.trainerSlots}>
                      {totalSlotsForTrainer(trainer)} horários disponíveis
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Select date */}
        {step === 2 && selectedTrainer && (
          <View style={styles.stepContent}>
            <Text style={styles.selectedTrainerLabel}>
              Personal: {selectedTrainer.name}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysRow}
            >
              {days.map((day, idx) => {
                const isSelected = idx === selectedDayIdx;
                const slotsCount = (selectedTrainer.availableSlots[idx] ?? []).length;
                const hasSlots = slotsCount > 0;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected,
                      !hasSlots && styles.dayCircleDisabled,
                    ]}
                    onPress={() => hasSlots && handleSelectDay(idx)}
                    disabled={!hasSlots}
                  >
                    <Text
                      style={[
                        styles.dayWeekday,
                        isSelected && styles.dayTextSelected,
                        !hasSlots && styles.dayTextDisabled,
                      ]}
                    >
                      {WEEKDAY_SHORT[day.getDay()]}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.dayTextSelected,
                        !hasSlots && styles.dayTextDisabled,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {hasSlots && (
                      <View style={[styles.availDot, isSelected && styles.availDotSelected]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time slots for selected day */}
            <Text style={styles.timeSectionTitle}>
              Horários disponíveis ({availableTimes.length})
            </Text>
            <View style={styles.timesGrid}>
              {availableTimes.length === 0 ? (
                <Text style={styles.noSlots}>Sem horários disponíveis neste dia</Text>
              ) : (
                availableTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.timeCard}
                    onPress={() => handleSelectTime(time)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeText}>{time}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedTrainer && selectedTime && (
          <View style={styles.stepContent}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Confirmar agendamento</Text>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Personal</Text>
                <Text style={styles.confirmValue}>{selectedTrainer.name}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Data</Text>
                <Text style={styles.confirmValue}>
                  {WEEKDAY_SHORT[days[selectedDayIdx].getDay()]},{' '}
                  {days[selectedDayIdx].getDate()}/
                  {(days[selectedDayIdx].getMonth() + 1).toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Horário</Text>
                <Text style={styles.confirmValue}>{selectedTime}</Text>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Confirmar agendamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Meus agendamentos */}
        <View style={styles.bookingsSection}>
          <Text style={styles.bookingsTitle}>Meus agendamentos</Text>
          {bookings.length === 0 ? (
            <Text style={styles.bookingsEmpty}>Nenhum agendamento</Text>
          ) : (
            bookings.map((b) => (
              <View key={b.id} style={styles.bookingCard}>
                <View style={styles.bookingLeft}>
                  <Text style={styles.bookingTrainer}>{b.trainerName}</Text>
                  <Text style={styles.bookingDateTime}>
                    {b.date} às {b.time}
                  </Text>
                </View>
                <View style={styles.bookingBadge}>
                  <Text style={styles.bookingBadgeText}>Confirmado</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: {
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginBottom: spacing.xl,
  },
  stepItem: { alignItems: 'center', gap: spacing.xs },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.orange },
  stepDotText: { fontSize: 14, fontFamily: fonts.numbersBold, color: colors.textMuted },
  stepDotTextActive: { color: colors.text },
  stepLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  stepLabelActive: { color: colors.text },

  backBtn: { marginBottom: spacing.md },
  backBtnText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.orange },

  stepContent: { marginBottom: spacing.xl },

  // Trainer cards
  trainerCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  trainerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerAvatarText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  trainerInfo: { flex: 1 },
  trainerName: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  trainerSpecialty: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trainerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  trainerRating: { fontSize: 13, fontFamily: fonts.numbersBold, color: colors.warning },
  trainerSlots: { fontSize: 12, fontFamily: fonts.numbers, color: colors.textMuted },

  // Selected trainer label
  selectedTrainerLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
    marginBottom: spacing.lg,
  },

  // Day selector
  daysRow: { gap: spacing.md, marginBottom: spacing.xl, paddingVertical: spacing.sm },
  dayCircle: {
    width: 56,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayCircleSelected: { backgroundColor: colors.orange },
  dayCircleDisabled: { opacity: 0.35 },
  dayWeekday: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.textSecondary },
  dayNumber: { fontSize: 18, fontFamily: fonts.numbersBold, color: colors.text },
  dayTextSelected: { color: colors.text },
  dayTextDisabled: { color: colors.textMuted },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  availDotSelected: { backgroundColor: colors.text },

  // Time slots
  timeSectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  timeText: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.text },
  noSlots: { fontSize: 14, fontFamily: fonts.body, color: colors.textMuted },

  // Confirmation
  confirmCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  confirmTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
  },
  confirmLabel: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary },
  confirmValue: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  confirmBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  confirmBtnText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },

  // Bookings
  bookingsSection: { marginTop: spacing.lg },
  bookingsTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bookingsEmpty: { fontSize: 14, fontFamily: fonts.body, color: colors.textMuted },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  bookingLeft: {},
  bookingTrainer: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  bookingDateTime: {
    fontSize: 13,
    fontFamily: fonts.numbers,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookingBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bookingBadgeText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.success },
});
