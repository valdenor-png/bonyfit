import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import CrossPlatformModal from '../components/ui/CrossPlatformModal';
import { colors, fonts, spacing, radius } from '../tokens';
import { Group } from '../types/social';

const CATEGORIES = ['Musculação', 'Corrida', 'Funcional', 'CrossFit', 'Luta', 'Outro'];

const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Musculação',
    description: 'Grupo para quem ama puxar ferro e ganhar massa!',
    icon: '💪',
    category: 'Musculação',
    members_count: 128,
    is_member: true,
    created_at: '2025-01-15',
  },
  {
    id: 'g2',
    name: 'Corrida',
    description: 'Corredores de todas as distâncias, do 5K à maratona.',
    icon: '🏃',
    category: 'Corrida',
    members_count: 85,
    is_member: false,
    created_at: '2025-02-10',
  },
  {
    id: 'g3',
    name: 'Funcional',
    description: 'Treinos funcionais e mobilidade para o dia a dia.',
    icon: '🧘',
    category: 'Funcional',
    members_count: 64,
    is_member: true,
    created_at: '2025-03-01',
  },
  {
    id: 'g4',
    name: 'CrossFit',
    description: 'WODs, PRs e comunidade CrossFit unida!',
    icon: '🏋️',
    category: 'CrossFit',
    members_count: 97,
    is_member: false,
    created_at: '2025-01-20',
  },
  {
    id: 'g5',
    name: 'Luta',
    description: 'Boxe, Muay Thai, Jiu-Jitsu e todas as artes marciais.',
    icon: '🥊',
    category: 'Luta',
    members_count: 53,
    is_member: false,
    created_at: '2025-04-05',
  },
  {
    id: 'g6',
    name: 'Yoga & Meditação',
    description: 'Equilíbrio entre corpo e mente com práticas diárias.',
    icon: '🧘‍♀️',
    category: 'Funcional',
    members_count: 42,
    is_member: false,
    created_at: '2025-05-12',
  },
];

interface Props {
  navigation: any;
}

export default function GruposScreen({ navigation }: Props) {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const toggleMembership = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              is_member: !g.is_member,
              members_count: g.is_member ? g.members_count - 1 : g.members_count + 1,
            }
          : g
      )
    );
  };

  const handleCreateGroup = () => {
    if (!newName.trim()) return;
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      icon: '⭐',
      category: selectedCategory,
      members_count: 1,
      is_member: true,
      created_at: new Date().toISOString(),
    };
    setGroups((prev) => [newGroup, ...prev]);
    setNewName('');
    setNewDescription('');
    setSelectedCategory(CATEGORIES[0]);
    setShowCreateModal(false);
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardMembers}>{item.members_count} membros</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, item.is_member && styles.joinedBtn]}
          onPress={() => toggleMembership(item.id)}
        >
          <Text style={[styles.joinText, item.is_member && styles.joinedText]}>
            {item.is_member ? 'Participando' : 'Entrar'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grupos</Text>

      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.createBtnText}>+ Criar grupo</Text>
      </TouchableOpacity>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Group Modal */}
      <CrossPlatformModal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Criar grupo</Text>

            <Text style={styles.inputLabel}>Nome do grupo</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Treino de manhã"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Descreva o grupo..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Categoria</Text>
            <View style={styles.categoryPicker}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateBtn} onPress={handleCreateGroup}>
                <Text style={styles.modalCreateText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CrossPlatformModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  createBtn: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  cardMembers: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joinBtn: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  joinedBtn: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  joinText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  joinedText: {
    color: colors.success,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
  },
  categoryChipActive: {
    backgroundColor: colors.orange,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  modalCreateBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.orange,
    alignItems: 'center',
  },
  modalCreateText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
