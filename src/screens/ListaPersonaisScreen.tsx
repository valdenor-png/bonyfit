import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface Personal {
  id: string;
  name: string;
  specialty: string;
  schedule: string;
  rating: number;
  students: number;
}

const MOCK_PERSONAIS: Personal[] = [
  { id: 'mock-1', name: 'Carlos Silva', specialty: 'Hipertrofia', schedule: '06h - 12h', rating: 4.9, students: 8 },
  { id: 'mock-2', name: 'Ana Oliveira', specialty: 'Emagrecimento', schedule: '08h - 14h', rating: 4.8, students: 12 },
  { id: 'mock-3', name: 'Rafael Costa', specialty: 'Funcional', schedule: '14h - 20h', rating: 4.7, students: 6 },
  { id: 'mock-4', name: 'Juliana Santos', specialty: 'Crossfit', schedule: '06h - 10h', rating: 4.8, students: 10 },
];

export default function ListaPersonaisScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [personais, setPersonais] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    loadPersonais();
  }, []);

  const loadPersonais = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('cargo_slug', 'personal');

      if (error || !data || data.length === 0) {
        setPersonais(MOCK_PERSONAIS);
      } else {
        const mapped: Personal[] = data.map((p: any) => ({
          id: p.id,
          name: p.name || 'Personal',
          specialty: 'Personal Trainer',
          schedule: '06h - 12h',
          rating: 4.8,
          students: 0,
        }));
        setPersonais(mapped);
      }
    } catch {
      setPersonais(MOCK_PERSONAIS);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersonal = (personal: Personal) => {
    Alert.alert(
      'Confirmar Personal',
      `Confirmar ${personal.name} como seu personal?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSelecting(true);
            try {
              const { error } = await supabase.from('personal_alunos').insert({
                aluno_id: user?.id,
                personal_id: personal.id,
                status: 'ativo',
                modo_escolha: 'aluno',
              });
              if (error) throw error;
              Alert.alert(
                'Personal definido!',
                `${personal.name} agora e seu personal exclusivo.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }],
              );
            } catch {
              Alert.alert('Erro', 'Nao foi possivel selecionar o personal.');
            } finally {
              setSelecting(false);
            }
          },
        },
      ],
    );
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const renderPersonal = ({ item }: { item: Personal }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectPersonal(item)}
      activeOpacity={0.7}
      disabled={selecting}
    >
      <View style={styles.cardRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardSpecialty}>{item.specialty}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Horario</Text>
          <Text style={styles.metaValue}>{item.schedule}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Avaliacao</Text>
          <Text style={styles.metaValue}>{'\u2B50'} {item.rating}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Alunos</Text>
          <Text style={styles.metaValue}>{item.students} alunos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personais Disponiveis</Text>
      </View>

      <FlatList
        data={personais}
        keyExtractor={(item) => item.id}
        renderItem={renderPersonal}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {selecting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // List
  list: {
    padding: spacing.lg,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  cardSpecialty: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#999999',
    marginTop: 2,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#333333',
    paddingTop: spacing.md,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
