import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── TYPES ──────────────────────────────────────────────
interface LeagueUser {
  id: string;
  name: string;
  initials: string;
  weeklyPoints: number;
  position: number;
  isCurrentUser: boolean;
}

type LeagueTier = 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';

// ─── LEAGUE COLORS ──────────────────────────────────────
const LEAGUE_COLORS: Record<LeagueTier, string> = {
  Bronze: '#CD7F32',
  Prata: '#C0C0C0',
  Ouro: '#FFD700',
  Diamante: '#B9F2FF',
};

const LEAGUE_GRADIENT: Record<LeagueTier, [string, string]> = {
  Bronze: ['#CD7F32', '#8B5A2B'],
  Prata: ['#C0C0C0', '#808080'],
  Ouro: ['#FFD700', '#B8960F'],
  Diamante: ['#B9F2FF', '#5BC0DE'],
};

const LEAGUE_ICONS: Record<LeagueTier, string> = {
  Bronze: '🥉',
  Prata: '🥈',
  Ouro: '🥇',
  Diamante: '💎',
};

// ─── MOCK DATA ──────────────────────────────────────────
const CURRENT_LEAGUE: LeagueTier = 'Ouro';
const CURRENT_WEEK = 3;
const DAYS_REMAINING = 4;

const MOCK_USERS: LeagueUser[] = [
  { id: '1', name: 'Rafael Costa', initials: 'RC', weeklyPoints: 1850, position: 1, isCurrentUser: false },
  { id: '2', name: 'Marina Silva', initials: 'MS', weeklyPoints: 1720, position: 2, isCurrentUser: false },
  { id: '3', name: 'Lucas Mendes', initials: 'LM', weeklyPoints: 1690, position: 3, isCurrentUser: false },
  { id: '4', name: 'Ana Beatriz', initials: 'AB', weeklyPoints: 1580, position: 4, isCurrentUser: false },
  { id: '5', name: 'Pedro Henrique', initials: 'PH', weeklyPoints: 1520, position: 5, isCurrentUser: false },
  { id: '6', name: 'Camila Rocha', initials: 'CR', weeklyPoints: 1460, position: 6, isCurrentUser: false },
  { id: '7', name: 'Thiago Alves', initials: 'TA', weeklyPoints: 1380, position: 7, isCurrentUser: false },
  { id: '8', name: 'João Victor', initials: 'JV', weeklyPoints: 1320, position: 8, isCurrentUser: true },
  { id: '9', name: 'Fernanda Lima', initials: 'FL', weeklyPoints: 1250, position: 9, isCurrentUser: false },
  { id: '10', name: 'Bruno Santos', initials: 'BS', weeklyPoints: 1180, position: 10, isCurrentUser: false },
  { id: '11', name: 'Juliana Matos', initials: 'JM', weeklyPoints: 1100, position: 11, isCurrentUser: false },
  { id: '12', name: 'Diego Ferreira', initials: 'DF', weeklyPoints: 1050, position: 12, isCurrentUser: false },
  { id: '13', name: 'Larissa Souza', initials: 'LS', weeklyPoints: 980, position: 13, isCurrentUser: false },
  { id: '14', name: 'Gabriel Oliveira', initials: 'GO', weeklyPoints: 920, position: 14, isCurrentUser: false },
  { id: '15', name: 'Isabela Ramos', initials: 'IR', weeklyPoints: 860, position: 15, isCurrentUser: false },
  { id: '16', name: 'Felipe Duarte', initials: 'FD', weeklyPoints: 780, position: 16, isCurrentUser: false },
  { id: '17', name: 'Amanda Pereira', initials: 'AP', weeklyPoints: 700, position: 17, isCurrentUser: false },
  { id: '18', name: 'Rodrigo Nunes', initials: 'RN', weeklyPoints: 620, position: 18, isCurrentUser: false },
  { id: '19', name: 'Beatriz Castro', initials: 'BC', weeklyPoints: 540, position: 19, isCurrentUser: false },
  { id: '20', name: 'Vitor Hugo', initials: 'VH', weeklyPoints: 450, position: 20, isCurrentUser: false },
];

// ─── COMPONENT ──────────────────────────────────────────
interface Props {
  navigation: any;
}

export default function LigasScreen({ navigation }: Props) {
  const currentUser = MOCK_USERS.find((u) => u.isCurrentUser)!;

  const getZoneStyle = (position: number) => {
    if (position <= 5) return styles.promotionZone;
    if (position >= 16) return styles.relegationZone;
    return null;
  };

  const getZoneLabel = (position: number) => {
    if (position <= 5) return 'Sobe ↑';
    if (position >= 16) return 'Desce ↓';
    return null;
  };

  const renderSectionHeader = (position: number, prevPosition: number | null) => {
    if (position === 1) {
      return (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: colors.success }]} />
          <Text style={styles.sectionHeaderText}>Zona de promoção</Text>
        </View>
      );
    }
    if (position === 6 && prevPosition !== null && prevPosition <= 5) {
      return (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.sectionHeaderText}>Zona segura</Text>
        </View>
      );
    }
    if (position === 16 && prevPosition !== null && prevPosition <= 15) {
      return (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.sectionHeaderText}>Zona de rebaixamento</Text>
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item, index }: { item: LeagueUser; index: number }) => {
    const prevPosition = index > 0 ? MOCK_USERS[index - 1].position : null;
    const zoneStyle = getZoneStyle(item.position);
    const zoneLabel = getZoneLabel(item.position);

    return (
      <>
        {renderSectionHeader(item.position, prevPosition)}
        <View
          style={[
            styles.userRow,
            zoneStyle,
            item.isCurrentUser && styles.currentUserRow,
          ]}
        >
          <Text style={[styles.positionText, item.position <= 3 && styles.topPositionText]}>
            {item.position}
          </Text>
          <View
            style={[
              styles.avatarCircle,
              item.isCurrentUser && { borderColor: colors.orange, borderWidth: 2 },
            ]}
          >
            <Text style={styles.avatarInitials}>{item.initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[styles.userName, item.isCurrentUser && styles.currentUserName]}
              numberOfLines={1}
            >
              {item.name}
              {item.isCurrentUser ? ' (você)' : ''}
            </Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.userPoints}>{item.weeklyPoints.toLocaleString()}</Text>
            <Text style={styles.userPointsLabel}>pts</Text>
          </View>
          {zoneLabel && (
            <Text
              style={[
                styles.zoneLabel,
                item.position <= 5 ? styles.zoneLabelPromotion : styles.zoneLabelRelegation,
              ]}
            >
              {zoneLabel}
            </Text>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <FlatList
        data={MOCK_USERS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <Text style={styles.headerTitle}>Ligas</Text>

            {/* Current League Card */}
            <LinearGradient
              colors={LEAGUE_GRADIENT[CURRENT_LEAGUE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leagueCard}
            >
              <View style={styles.leagueCardTop}>
                <Text style={styles.leagueIcon}>{LEAGUE_ICONS[CURRENT_LEAGUE]}</Text>
                <View style={styles.leagueCardInfo}>
                  <Text style={styles.leagueName}>Liga {CURRENT_LEAGUE}</Text>
                  <Text style={styles.leagueWeek}>Semana {CURRENT_WEEK}</Text>
                </View>
              </View>
              <Text style={styles.leagueEnds}>Termina em {DAYS_REMAINING} dias</Text>
            </LinearGradient>

            {/* Your Position */}
            <View style={styles.positionCard}>
              <Text style={styles.positionCardLabel}>Sua posição</Text>
              <Text style={styles.positionCardValue}>
                #{currentUser.position} de 20
              </Text>
              <Text style={styles.positionCardPoints}>
                {currentUser.weeklyPoints.toLocaleString()} pontos esta semana
              </Text>
            </View>

            {/* Leaderboard title */}
            <Text style={styles.leaderboardTitle}>Classificação</Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  // League Card
  leagueCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  leagueCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leagueIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  leagueCardInfo: {
    flex: 1,
  },
  leagueName: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: '#000000',
  },
  leagueWeek: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
  },
  leagueEnds: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
  },

  // Position Card
  positionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  positionCardLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  positionCardValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 32,
    color: colors.orange,
  },
  positionCardPoints: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Leaderboard
  leaderboardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  sectionHeaderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // User Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  currentUserRow: {
    borderWidth: 2,
    borderColor: colors.orange,
  },
  promotionZone: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  relegationZone: {
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
  },
  positionText: {
    fontFamily: fonts.numbersBold,
    fontSize: 16,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  topPositionText: {
    color: colors.orange,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  avatarInitials: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  currentUserName: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginRight: spacing.xs,
  },
  userPoints: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
  },
  userPointsLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  zoneLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginLeft: spacing.xs,
    width: 56,
    textAlign: 'center',
  },
  zoneLabelPromotion: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    color: colors.success,
  },
  zoneLabelRelegation: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    color: colors.danger,
  },
});
