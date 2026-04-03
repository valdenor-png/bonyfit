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

// --- MOCK DATA ---
const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

type ClassItem = {
  id: string;
  name: string;
  timeStart: string;
  timeEnd: string;
  instructor: string;
  unit: string;
  capacity: number;
  booked: number;
  reserved: boolean;
};

const MOCK_CLASSES: Record<number, ClassItem[]> = {
  0: [
    { id: 's1', name: 'Spinning', timeStart: '07:00', timeEnd: '08:00', instructor: 'Ana Oliveira', unit: 'Unidade Centro', capacity: 20, booked: 12, reserved: false },
    { id: 's2', name: 'Yoga', timeStart: '08:00', timeEnd: '09:00', instructor: 'Camila Souza', unit: 'Unidade Centro', capacity: 15, booked: 15, reserved: false },
    { id: 's3', name: 'HIIT', timeStart: '10:00', timeEnd: '11:00', instructor: 'Roberto Mendes', unit: 'Unidade Norte', capacity: 25, booked: 18, reserved: true },
    { id: 's4', name: 'Funcional', timeStart: '17:00', timeEnd: '18:00', instructor: 'Carlos Silva', unit: 'Unidade Centro', capacity: 20, booked: 7, reserved: false },
    { id: 's5', name: 'Zumba', timeStart: '19:00', timeEnd: '20:00', instructor: 'Patrícia Lima', unit: 'Unidade Sul', capacity: 30, booked: 22, reserved: false },
  ],
  1: [
    { id: 't1', name: 'Pilates', timeStart: '07:00', timeEnd: '08:00', instructor: 'Camila Souza', unit: 'Unidade Centro', capacity: 15, booked: 10, reserved: false },
    { id: 't2', name: 'Spinning', timeStart: '09:00', timeEnd: '10:00', instructor: 'Ana Oliveira', unit: 'Unidade Norte', capacity: 20, booked: 20, reserved: false },
    { id: 't3', name: 'Funcional', timeStart: '11:00', timeEnd: '12:00', instructor: 'Roberto Mendes', unit: 'Unidade Centro', capacity: 25, booked: 14, reserved: false },
    { id: 't4', name: 'HIIT', timeStart: '18:00', timeEnd: '19:00', instructor: 'Carlos Silva', unit: 'Unidade Sul', capacity: 20, booked: 19, reserved: true },
  ],
  2: [
    { id: 'q1', name: 'Yoga', timeStart: '06:00', timeEnd: '07:00', instructor: 'Camila Souza', unit: 'Unidade Centro', capacity: 15, booked: 8, reserved: false },
    { id: 'q2', name: 'Spinning', timeStart: '08:00', timeEnd: '09:00', instructor: 'Ana Oliveira', unit: 'Unidade Centro', capacity: 20, booked: 16, reserved: false },
    { id: 'q3', name: 'Zumba', timeStart: '10:00', timeEnd: '11:00', instructor: 'Patrícia Lima', unit: 'Unidade Norte', capacity: 30, booked: 30, reserved: false },
    { id: 'q4', name: 'Funcional', timeStart: '17:00', timeEnd: '18:00', instructor: 'Roberto Mendes', unit: 'Unidade Centro', capacity: 25, booked: 11, reserved: false },
    { id: 'q5', name: 'HIIT', timeStart: '19:00', timeEnd: '20:00', instructor: 'Carlos Silva', unit: 'Unidade Sul', capacity: 20, booked: 5, reserved: false },
  ],
  3: [
    { id: 'qi1', name: 'Pilates', timeStart: '07:00', timeEnd: '08:00', instructor: 'Camila Souza', unit: 'Unidade Centro', capacity: 15, booked: 12, reserved: false },
    { id: 'qi2', name: 'HIIT', timeStart: '09:00', timeEnd: '10:00', instructor: 'Roberto Mendes', unit: 'Unidade Norte', capacity: 25, booked: 25, reserved: false },
    { id: 'qi3', name: 'Spinning', timeStart: '17:00', timeEnd: '18:00', instructor: 'Ana Oliveira', unit: 'Unidade Centro', capacity: 20, booked: 13, reserved: false },
    { id: 'qi4', name: 'Funcional', timeStart: '18:00', timeEnd: '19:00', instructor: 'Carlos Silva', unit: 'Unidade Sul', capacity: 20, booked: 9, reserved: true },
  ],
  4: [
    { id: 'sx1', name: 'Spinning', timeStart: '07:00', timeEnd: '08:00', instructor: 'Ana Oliveira', unit: 'Unidade Centro', capacity: 20, booked: 17, reserved: false },
    { id: 'sx2', name: 'Yoga', timeStart: '09:00', timeEnd: '10:00', instructor: 'Camila Souza', unit: 'Unidade Norte', capacity: 15, booked: 6, reserved: false },
    { id: 'sx3', name: 'HIIT', timeStart: '11:00', timeEnd: '12:00', instructor: 'Roberto Mendes', unit: 'Unidade Centro', capacity: 25, booked: 21, reserved: false },
    { id: 'sx4', name: 'Zumba', timeStart: '17:00', timeEnd: '18:00', instructor: 'Patrícia Lima', unit: 'Unidade Sul', capacity: 30, booked: 15, reserved: false },
    { id: 'sx5', name: 'Funcional', timeStart: '19:00', timeEnd: '20:00', instructor: 'Carlos Silva', unit: 'Unidade Centro', capacity: 20, booked: 20, reserved: false },
  ],
  5: [
    { id: 'sb1', name: 'Yoga', timeStart: '08:00', timeEnd: '09:00', instructor: 'Camila Souza', unit: 'Unidade Centro', capacity: 15, booked: 4, reserved: false },
    { id: 'sb2', name: 'Spinning', timeStart: '09:00', timeEnd: '10:00', instructor: 'Ana Oliveira', unit: 'Unidade Centro', capacity: 20, booked: 11, reserved: false },
    { id: 'sb3', name: 'Funcional', timeStart: '10:00', timeEnd: '11:00', instructor: 'Roberto Mendes', unit: 'Unidade Norte', capacity: 25, booked: 18, reserved: false },
    { id: 'sb4', name: 'Zumba', timeStart: '11:00', timeEnd: '12:00', instructor: 'Patrícia Lima', unit: 'Unidade Sul', capacity: 30, booked: 22, reserved: false },
  ],
};

// --- COMPONENT ---
export default function AulasScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [classes, setClasses] = useState<Record<number, ClassItem[]>>(MOCK_CLASSES);

  const dayClasses = classes[selectedDay] ?? [];

  const handleReservar = (classId: string) => {
    setClasses((prev) => {
      const updated = { ...prev };
      updated[selectedDay] = updated[selectedDay].map((c) => {
        if (c.id === classId) {
          return { ...c, reserved: true, booked: c.booked + 1 };
        }
        return c;
      });
      return updated;
    });
    Alert.alert('Reservado!', 'Sua vaga foi reservada com sucesso.');
  };

  const capacityColor = (booked: number, capacity: number): string => {
    const ratio = booked / capacity;
    if (ratio >= 1) return colors.danger;
    if (ratio >= 0.7) return colors.orange;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.header}>Aulas Coletivas</Text>

        {/* Day tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabs}
        >
          {DAYS.map((day, idx) => {
            const isSelected = idx === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isSelected && styles.dayTabSelected]}
                onPress={() => setSelectedDay(idx)}
              >
                <Text style={[styles.dayTabText, isSelected && styles.dayTabTextSelected]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Classes list */}
        {dayClasses.map((cls) => {
          const isFull = cls.booked >= cls.capacity;
          const color = capacityColor(cls.booked, cls.capacity);
          const ratio = cls.booked / cls.capacity;

          return (
            <View key={cls.id} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View style={styles.classTimeBox}>
                  <Text style={styles.classTime}>{cls.timeStart}</Text>
                  <Text style={styles.classTimeSep}>-</Text>
                  <Text style={styles.classTime}>{cls.timeEnd}</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classInstructor}>{cls.instructor}</Text>
                  <Text style={styles.classUnit}>{cls.unit}</Text>
                </View>
              </View>

              {/* Capacity */}
              <View style={styles.capacityRow}>
                <View style={styles.capacityBarBg}>
                  <View
                    style={[
                      styles.capacityBarFill,
                      {
                        width: `${Math.min(ratio * 100, 100)}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.capacityText, { color }]}>
                  {cls.booked}/{cls.capacity} vagas
                </Text>
              </View>

              {/* Action */}
              {cls.reserved ? (
                <View style={styles.reservedBadge}>
                  <Text style={styles.reservedBadgeText}>Reservado ✓</Text>
                </View>
              ) : isFull ? (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullBadgeText}>Lotada</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.reservarBtn}
                  onPress={() => handleReservar(cls.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reservarBtnText}>Reservar vaga</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {dayClasses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma aula neste dia</Text>
          </View>
        )}
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

  // Day tabs
  dayTabs: { gap: spacing.sm, marginBottom: spacing.xl, paddingVertical: spacing.xs },
  dayTab: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  dayTabSelected: { backgroundColor: colors.orange },
  dayTabText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.textSecondary },
  dayTabTextSelected: { color: colors.text },

  // Class card
  classCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  classHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  classTimeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 60,
  },
  classTime: { fontSize: 14, fontFamily: fonts.numbersBold, color: colors.text },
  classTimeSep: { fontSize: 10, fontFamily: fonts.numbers, color: colors.textMuted },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  classInstructor: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  classUnit: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Capacity
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  capacityBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityBarFill: { height: '100%', borderRadius: 3 },
  capacityText: { fontSize: 12, fontFamily: fonts.numbers },

  // Buttons / badges
  reservarBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  reservarBtnText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  reservedBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  reservedBadgeText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.success },
  fullBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  fullBadgeText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.danger },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: { fontSize: 14, fontFamily: fonts.body, color: colors.textMuted },
});
