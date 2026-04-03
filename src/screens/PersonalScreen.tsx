import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import PersonalCard from '../components/PersonalCard';
import { Trainer } from '../types/payment';

const MOCK_TRAINERS: Trainer[] = [
  { id: '1', name: 'Carlos Mendes', specialty: 'Musculação', unit_id: '1', avatar_url: null, rating: 4.9, on_floor: true, since_time: '06:00', students_count: 3 },
  { id: '2', name: 'Ana Beatriz', specialty: 'Funcional', unit_id: '1', avatar_url: null, rating: 4.8, on_floor: true, since_time: '07:30', students_count: 5 },
  { id: '3', name: 'Ricardo Silva', specialty: 'Crossfit', unit_id: '1', avatar_url: null, rating: 4.7, on_floor: true, since_time: '08:00', students_count: 2 },
];

export default function PersonalScreen() {
  const trainersOnFloor = MOCK_TRAINERS.filter((t) => t.on_floor);

  return (
    <View style={styles.container}>
      {/* Header card */}
      <LinearGradient
        colors={[colors.orangeDark, colors.orange]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Personais no salão agora</Text>
          <Text style={styles.headerCount}>{trainersOnFloor.length}</Text>
          <Text style={styles.headerSub}>disponíveis</Text>
        </View>
        <View style={styles.avatarsStack}>
          {trainersOnFloor.slice(0, 4).map((t, i) => (
            <View
              key={t.id}
              style={[
                styles.stackAvatar,
                { marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i },
              ]}
            >
              <Text style={styles.stackAvatarText}>{t.name[0]}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Trainers list */}
      <FlatList
        data={trainersOnFloor}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PersonalCard trainer={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum personal no salão agora</Text>
            <Text style={styles.emptySubtext}>Volte mais tarde para ver quem está disponível</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  headerLabel: { fontSize: 12, fontFamily: fonts.body, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xs },
  headerCount: { fontSize: 36, fontFamily: fonts.numbersBold, color: colors.text },
  headerSub: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.8)' },
  avatarsStack: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: colors.orangeDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: fonts.body, color: colors.textMuted, marginTop: spacing.sm },
});
