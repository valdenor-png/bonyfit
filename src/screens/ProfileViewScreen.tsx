import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import CrossPlatformModal from '../components/ui/CrossPlatformModal';
import { colors, fonts, spacing, radius } from '../tokens';
import Button from '../components/Button';
import { getLevel } from '../types/user';

interface Props {
  navigation: any;
  route: { params: { userId: string } };
}

// Mock data for demo
const MOCK_USER = {
  id: 'u1',
  name: 'Maria Silva',
  level: 'Ouro' as const,
  streak: 15,
  points: 12500,
  totalWorkouts: 87,
  ranking: 14,
  following: 42,
  followers: 128,
  memberSince: 'Mar 2025',
  posts: [
    { id: '1', text: 'Treino de peito destruído hoje! 💪', likes: 24, time: '2h' },
    { id: '2', text: 'Novo recorde no supino! 100kg! 🔥', likes: 56, time: '1d' },
  ],
};

export default function ProfileViewScreen({ navigation, route }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const user = MOCK_USER;

  const handleBlock = () => {
    setShowMenu(false);
    Alert.alert('Bloquear usuário', 'Tem certeza que deseja bloquear este usuário?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Bloquear', style: 'destructive', onPress: () => Alert.alert('Bloqueado', 'Usuário bloqueado com sucesso.') },
    ]);
  };

  const handleReport = () => {
    setShowMenu(false);
    Alert.alert('Denunciar', 'Deseja denunciar este usuário por conteúdo impróprio?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Denunciar', style: 'destructive', onPress: () => Alert.alert('Denunciado', 'Denúncia enviada. Obrigado.') },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuBtn}>
            <Text style={styles.menuText}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0]}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.badges}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{user.level}</Text>
            </View>
            <Text style={styles.streakText}>🔥 {user.streak} dias</Text>
          </View>

          {/* TODO: Show presence indicator only for mutual friends */}
          {/* {isMutualFriend && profileUser.mostrar_presenca && isTrainingNow && ( */}
          {/*   <View style={styles.presenceBadge}> */}
          {/*     <Text>🟢 Na academia agora</Text> */}
          {/*   </View> */}
          {/* )} */}
        </View>

        {/* Message button */}
        <Button
          title="💬 Mensagem"
          onPress={() => navigation.navigate('Chat', { userId: user.id, userName: user.name })}
        />

        {/* Follow button */}
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={() => setIsFollowing((prev) => !prev)}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
            {isFollowing ? '✓ Seguindo' : 'Seguir'}
          </Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{user.ranking}</Text>
              <Text style={styles.statLabel}>Ranking</Text>
            </View>
          </View>
          <View style={styles.statsRowDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.following}</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.followers + (isFollowing ? 1 : 0)}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
          </View>
        </View>

        {/* Recent Posts */}
        <Text style={styles.sectionTitle}>Posts recentes</Text>
        {user.posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <Text style={styles.postText}>{post.text}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postLikes}>❤ {post.likes}</Text>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Menu Modal */}
      <CrossPlatformModal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
              <Text style={styles.menuItemDanger}>🚫 Bloquear usuário</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Text style={styles.menuItemDanger}>⚠️ Denunciar conteúdo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuItemCancel}>✕ Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </CrossPlatformModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.orange },
  menuBtn: { padding: spacing.sm },
  menuText: { fontSize: 24, color: colors.textSecondary },
  profileSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(242, 101, 34, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(242, 101, 34, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 28, fontFamily: fonts.bodyBold, color: colors.orange },
  name: { fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBadge: {
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  levelText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.orange },
  streakText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  followBtn: {
    backgroundColor: colors.orange,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    width: '100%',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  followBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  followBtnTextActive: {
    color: colors.orange,
  },
  stats: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row' as const,
  },
  statsRowDivider: {
    height: 1,
    backgroundColor: colors.elevated,
    marginVertical: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' as const },
  statValue: { fontSize: 18, fontFamily: fonts.numbersBold, color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  statDivider: { width: 1, backgroundColor: colors.elevated },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  postText: { fontSize: 14, fontFamily: fonts.body, color: colors.text, marginBottom: spacing.sm },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  postLikes: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted },
  postTime: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted },
  // Menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  menuCard: { backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden' },
  menuItem: { padding: spacing.xl, borderBottomWidth: 0.5, borderBottomColor: colors.elevated },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemDanger: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.danger, textAlign: 'center' },
  menuItemCancel: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
});
