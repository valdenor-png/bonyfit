import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import ProgressRing from '../components/ProgressRing';
import Button from '../components/Button';

// ─── TYPES ──────────────────────────────────────────────
interface Protocol {
  id: string;
  name: string;
  fastHours: number;
  eatHours: number;
  description: string;
}

interface FastEntry {
  id: string;
  date: string;
  protocol: string;
  duration: string;
  completed: boolean;
}

// ─── DATA ───────────────────────────────────────────────
const PROTOCOLS: Protocol[] = [
  { id: '16:8', name: '16:8', fastHours: 16, eatHours: 8, description: 'Jejum de 16h, janela alimentar de 8h. Ideal para iniciantes.' },
  { id: '18:6', name: '18:6', fastHours: 18, eatHours: 6, description: 'Jejum de 18h, janela alimentar de 6h. Intermediário.' },
  { id: '20:4', name: '20:4', fastHours: 20, eatHours: 4, description: 'Jejum de 20h, janela alimentar de 4h. Avançado.' },
  { id: 'OMAD', name: 'OMAD', fastHours: 23, eatHours: 1, description: 'Uma refeição por dia. Apenas 1h para comer.' },
];

const MOCK_HISTORY: FastEntry[] = [
  { id: '1', date: '02/04/2026', protocol: '16:8', duration: '16h 12min', completed: true },
  { id: '2', date: '01/04/2026', protocol: '16:8', duration: '16h 05min', completed: true },
  { id: '3', date: '31/03/2026', protocol: '16:8', duration: '14h 30min', completed: false },
  { id: '4', date: '30/03/2026', protocol: '18:6', duration: '18h 22min', completed: true },
  { id: '5', date: '29/03/2026', protocol: '16:8', duration: '16h 00min', completed: true },
  { id: '6', date: '28/03/2026', protocol: '16:8', duration: '16h 45min', completed: true },
  { id: '7', date: '27/03/2026', protocol: '16:8', duration: '15h 10min', completed: false },
  { id: '8', date: '26/03/2026', protocol: '20:4', duration: '20h 05min', completed: true },
  { id: '9', date: '25/03/2026', protocol: '16:8', duration: '16h 30min', completed: true },
  { id: '10', date: '24/03/2026', protocol: '16:8', duration: '16h 18min', completed: true },
];

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function JejumScreen() {
  const navigation = useNavigation();

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(PROTOCOLS[0]);
  const [isFasting, setIsFasting] = useState(false);
  const [fastingStart, setFastingStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<FastEntry[]>(MOCK_HISTORY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const streak = (() => {
    let count = 0;
    for (const entry of history) {
      if (entry.completed) count++;
      else break;
    }
    return count;
  })();

  const totalFastSeconds = selectedProtocol.fastHours * 3600;
  const totalCycleSeconds = (selectedProtocol.fastHours + selectedProtocol.eatHours) * 3600;

  // Determine if currently in fasting or eating window
  const isInEatingWindow = isFasting && elapsed > totalFastSeconds;
  const effectiveProgress = isFasting
    ? isInEatingWindow
      ? 1
      : elapsed / totalFastSeconds
    : 0;

  const timeRemaining = isFasting
    ? isInEatingWindow
      ? totalCycleSeconds - elapsed
      : totalFastSeconds - elapsed
    : totalFastSeconds;

  useEffect(() => {
    if (isFasting && fastingStart) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - fastingStart) / 1000);
        setElapsed(diff);

        // Auto-complete when cycle finishes
        if (diff >= totalCycleSeconds) {
          handleBreakFast(true);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFasting, fastingStart, totalCycleSeconds]);

  const handleStartFast = () => {
    setFastingStart(Date.now());
    setElapsed(0);
    setIsFasting(true);
  };

  const handleBreakFast = (autoComplete = false) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const completed = autoComplete || elapsed >= totalFastSeconds;
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);

    const newEntry: FastEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-BR'),
      protocol: selectedProtocol.name,
      duration: `${hours}h ${mins.toString().padStart(2, '0')}min`,
      completed,
    };

    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
    setIsFasting(false);
    setFastingStart(null);
    setElapsed(0);
  };

  const ringColor = isFasting
    ? isInEatingWindow
      ? colors.success
      : colors.orange
    : colors.elevated;

  const statusLabel = isFasting
    ? isInEatingWindow
      ? 'Janela alimentar'
      : 'Jejuando'
    : 'Pronto para iniciar';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jejum Intermitente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Protocol Selector */}
        <Text style={styles.sectionTitle}>Protocolo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.protocolScroll}>
          {PROTOCOLS.map((protocol) => {
            const isSelected = selectedProtocol.id === protocol.id;
            return (
              <TouchableOpacity
                key={protocol.id}
                style={[styles.protocolCard, isSelected && styles.protocolCardSelected]}
                onPress={() => !isFasting && setSelectedProtocol(protocol)}
                activeOpacity={isFasting ? 1 : 0.7}
              >
                <Text style={[styles.protocolName, isSelected && styles.protocolNameSelected]}>
                  {protocol.name}
                </Text>
                <Text style={styles.protocolWindow}>
                  {protocol.eatHours}h janela
                </Text>
                <Text style={styles.protocolDesc} numberOfLines={2}>
                  {protocol.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timer Ring */}
        <View style={styles.timerSection}>
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <View style={styles.timerRingWrapper}>
            <ProgressRing
              progress={effectiveProgress}
              size={200}
              strokeWidth={12}
              color={ringColor}
            >
              <View style={styles.timerContent}>
                <Text style={styles.timerText}>
                  {isFasting ? formatTimer(timeRemaining > 0 ? timeRemaining : 0) : formatTimer(totalFastSeconds)}
                </Text>
                <Text style={styles.timerSubtext}>
                  {isFasting ? 'restante' : `${selectedProtocol.fastHours}h de jejum`}
                </Text>
              </View>
            </ProgressRing>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonSection}>
          {!isFasting ? (
            <Button title="Iniciar jejum" onPress={handleStartFast} variant="primary" />
          ) : (
            <Button title="Quebrar jejum" onPress={() => handleBreakFast(false)} variant="outline" />
          )}
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>{'\uD83D\uDD25'}</Text>
          <Text style={styles.streakText}>{streak} jejuns seguidos</Text>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>Histórico</Text>
        <View style={styles.historyCard}>
          {history.map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <Text style={styles.historyMeta}>
                  {entry.protocol} • {entry.duration}
                </Text>
              </View>
              <View style={[styles.historyBadge, { backgroundColor: entry.completed ? colors.success + '20' : colors.danger + '20' }]}>
                <Text style={{ color: entry.completed ? colors.success : colors.danger, fontSize: 14 }}>
                  {entry.completed ? '\u2713' : '\u2717'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  protocolScroll: {
    marginBottom: spacing.xxl,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  protocolCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    width: 150,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  protocolCardSelected: {
    borderColor: colors.orange,
  },
  protocolName: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  protocolNameSelected: {
    color: colors.orange,
  },
  protocolWindow: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  protocolDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statusLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  timerRingWrapper: {
    alignItems: 'center',
  },
  timerContent: {
    alignItems: 'center',
  },
  timerText: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 28,
    color: colors.text,
  },
  timerSubtext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  buttonSection: {
    marginBottom: spacing.xxl,
  },
  streakCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  streakEmoji: {
    fontSize: 22,
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.orange,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
  },
  historyMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
