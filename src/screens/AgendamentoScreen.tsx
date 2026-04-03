import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// --- HELPERS ---
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

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function formatDateLabel(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

// --- MOCK DATA ---
type SlotData = {
  time: string;
  capacity: number;
  booked: number;
};

function generateSlots(dateIndex: number): SlotData[] {
  const morning = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
  const afternoon = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const night = ['18:00', '19:00', '20:00', '21:00'];
  const allTimes = [...morning, ...afternoon, ...night];

  return allTimes.map((time, i) => {
    const seed = (dateIndex * 17 + i * 7) % 40;
    const capacity = 40;
    const booked = Math.min(capacity, seed + 10 + (i % 5) * 4);
    return { time, capacity, booked };
  });
}

type Reservation = {
  id: string;
  date: string;
  time: string;
};

const MOCK_RESERVATIONS: Reservation[] = [
  { id: '1', date: 'Amanhã', time: '07:00' },
  { id: '2', date: 'Sexta', time: '18:00' },
];

function slotColor(booked: number, capacity: number): string {
  const ratio = booked / capacity;
  if (ratio >= 1) return colors.danger;
  if (ratio >= 0.7) return colors.orange;
  return colors.success;
}

// --- COMPONENT ---
export default function AgendamentoScreen() {
  const days = getNext7Days();
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);

  const slots = generateSlots(selectedDayIdx);

  const morningSlots = slots.filter((s) => {
    const h = parseInt(s.time);
    return h >= 6 && h < 12;
  });
  const afternoonSlots = slots.filter((s) => {
    const h = parseInt(s.time);
    return h >= 12 && h < 18;
  });
  const nightSlots = slots.filter((s) => {
    const h = parseInt(s.time);
    return h >= 18;
  });

  const handleReservar = () => {
    if (!selectedSlot) return;
    const day = days[selectedDayIdx];
    const label = selectedDayIdx === 0 ? 'Hoje' : WEEKDAY_SHORT[day.getDay()];
    setReservations((prev) => [
      ...prev,
      { id: Date.now().toString(), date: label, time: selectedSlot },
    ]);
    Alert.alert('Reservado!', `Horário ${selectedSlot} reservado com sucesso.`);
    setSelectedSlot(null);
  };

  const renderSlotGroup = (title: string, groupSlots: SlotData[]) => (
    <View style={styles.slotGroup}>
      <Text style={styles.slotGroupTitle}>{title}</Text>
      <View style={styles.slotsGrid}>
        {groupSlots.map((slot) => {
          const isFull = slot.booked >= slot.capacity;
          const isSelected = selectedSlot === slot.time;
          const color = slotColor(slot.booked, slot.capacity);
          const ratio = slot.booked / slot.capacity;

          return (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.slotCard,
                isSelected && styles.slotCardSelected,
                isFull && styles.slotCardFull,
              ]}
              onPress={() => !isFull && setSelectedSlot(slot.time)}
              disabled={isFull}
              activeOpacity={0.7}
            >
              <Text style={[styles.slotTime, isFull && styles.slotTimeFull]}>
                {slot.time}
              </Text>
              <View style={styles.capacityBarBg}>
                <View
                  style={[
                    styles.capacityBarFill,
                    { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={[styles.slotCapacity, { color }]}>
                {slot.booked}/{slot.capacity} vagas
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.header}>Agendamento</Text>

        {/* Date selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {days.map((day, idx) => {
            const isSelected = idx === selectedDayIdx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                onPress={() => {
                  setSelectedDayIdx(idx);
                  setSelectedSlot(null);
                }}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayTextSelected]}>
                  {WEEKDAY_SHORT[day.getDay()]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time slots */}
        {renderSlotGroup('Manhã', morningSlots)}
        {renderSlotGroup('Tarde', afternoonSlots)}
        {renderSlotGroup('Noite', nightSlots)}

        {/* Reservar button */}
        <TouchableOpacity
          style={[styles.reservarBtn, !selectedSlot && styles.reservarBtnDisabled]}
          onPress={handleReservar}
          disabled={!selectedSlot}
        >
          <Text style={styles.reservarBtnText}>
            {selectedSlot ? `Reservar ${selectedSlot}` : 'Selecione um horário'}
          </Text>
        </TouchableOpacity>

        {/* Minhas reservas */}
        <View style={styles.reservasSection}>
          <Text style={styles.reservasTitle}>Minhas reservas</Text>
          {reservations.length === 0 ? (
            <Text style={styles.reservasEmpty}>Nenhuma reserva agendada</Text>
          ) : (
            reservations.map((r) => (
              <View key={r.id} style={styles.reservaCard}>
                <View style={styles.reservaInfo}>
                  <Text style={styles.reservaDate}>{r.date}</Text>
                  <Text style={styles.reservaTime}>{r.time}</Text>
                </View>
                <View style={styles.reservaBadge}>
                  <Text style={styles.reservaBadgeText}>Confirmado</Text>
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
    marginBottom: spacing.xl,
  },

  // Day selector
  daysRow: { gap: spacing.md, marginBottom: spacing.xl, paddingVertical: spacing.sm },
  dayCircle: {
    width: 56,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayCircleSelected: {
    backgroundColor: colors.orange,
  },
  dayWeekday: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.textSecondary },
  dayNumber: { fontSize: 18, fontFamily: fonts.numbersBold, color: colors.text },
  dayTextSelected: { color: colors.text },

  // Slot groups
  slotGroup: { marginBottom: spacing.xl },
  slotGroupTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotCardSelected: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(242, 101, 34, 0.08)',
  },
  slotCardFull: {
    opacity: 0.5,
  },
  slotTime: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  slotTimeFull: { color: colors.textMuted },
  capacityBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.elevated,
    borderRadius: 2,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  slotCapacity: {
    fontSize: 10,
    fontFamily: fonts.numbers,
    color: colors.textSecondary,
  },

  // Reservar button
  reservarBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  reservarBtnDisabled: {
    backgroundColor: colors.elevated,
  },
  reservarBtnText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // Minhas reservas
  reservasSection: { marginTop: spacing.sm },
  reservasTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  reservasEmpty: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  reservaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  reservaInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reservaDate: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  reservaTime: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.text },
  reservaBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  reservaBadgeText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.success },
});
