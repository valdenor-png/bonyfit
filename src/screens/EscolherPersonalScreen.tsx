import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useVip } from '../hooks/useVip';
import { Ionicons } from '@expo/vector-icons';

interface PersonalAtribuido {
  id: string;
  name: string;
  specialty?: string;
}

export default function EscolherPersonalScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { isVip } = useVip(user?.id);
  const [personalAtual, setPersonalAtual] = useState<PersonalAtribuido | null>(null);
  const [aguardando, setAguardando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonalAtual();
  }, [user?.id]);

  const loadPersonalAtual = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('personal_alunos')
        .select('id, status, modo_escolha, personal:personal_id(id, name)')
        .eq('aluno_id', user.id)
        .in('status', ['ativo', 'pendente'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        if (data.status === 'pendente') {
          setAguardando(true);
        } else if (data.personal) {
          const p = data.personal as any;
          setPersonalAtual({ id: p.id, name: p.name });
        }
      }
    } catch {
      // No personal assigned yet
    } finally {
      setLoading(false);
    }
  };

  const handleDeixarSalaoEscolher = () => {
    Alert.alert(
      'Confirmar',
      'O personal responsavel vai indicar o melhor profissional pra voce. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const { error } = await supabase.from('personal_alunos').insert({
                aluno_id: user?.id,
                status: 'pendente',
                modo_escolha: 'salao',
              });
              if (error) throw error;
              setAguardando(true);
              Alert.alert('Solicitacao enviada!', 'Aguardando atribuicao de personal.');
            } catch {
              Alert.alert('Erro', 'Nao foi possivel enviar a solicitacao.');
            }
          },
        },
      ],
    );
  };

  const handleTrocarPersonal = () => {
    Alert.alert(
      'Trocar Personal',
      'Deseja trocar seu personal atual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          onPress: () => {
            setPersonalAtual(null);
            setAguardando(false);
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  // Aguardando atribuicao
  if (aguardando) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Escolher Personal</Text>
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        </View>

        <View style={styles.aguardandoCard}>
          <Text style={styles.aguardandoEmoji}>{'\\u23F3'}</Text>
          <Text style={styles.aguardandoTitle}>Aguardando atribuicao...</Text>
          <Text style={styles.aguardandoSub}>
            O salao vai escolher o melhor personal pra voce. Voce sera notificado quando for definido.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Ja tem personal
  if (personalAtual) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Seu Personal</Text>
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        </View>

        <View style={styles.personalAtualCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {personalAtual.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.personalNome}>{personalAtual.name}</Text>
          {personalAtual.specialty && (
            <Text style={styles.personalSpecialty}>{personalAtual.specialty}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.trocarBtn} onPress={handleTrocarPersonal} activeOpacity={0.8}>
          <Text style={styles.trocarBtnText}>Trocar Personal</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Escolher personal
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={colors.orange} />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Escolher Personal</Text>
        <View style={styles.vipBadge}>
          <Text style={styles.vipBadgeText}>VIP</Text>
        </View>
      </View>

      {/* Card 1 - Eu quero escolher */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => navigation.navigate('ListaPersonais')}
        activeOpacity={0.7}
      >
        <Text style={styles.optionEmoji}>{'\uD83C\uDFCB\uFE0F'}</Text>
        <Text style={styles.optionTitle}>EU QUERO ESCOLHER</Text>
        <Text style={styles.optionSub}>
          Veja os personais disponiveis e escolha o seu favorito
        </Text>
      </TouchableOpacity>

      {/* Card 2 - Deixar o salao escolher */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleDeixarSalaoEscolher}
        activeOpacity={0.7}
      >
        <Text style={styles.optionEmoji}>{'\uD83E\uDD1D'}</Text>
        <Text style={styles.optionTitle}>DEIXAR O SALAO ESCOLHER</Text>
        <Text style={styles.optionSub}>
          O personal responsavel vai indicar o melhor pra voce
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back button
  backBtn: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  vipBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  vipBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Option cards
  optionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: spacing.lg,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  optionSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#999999',
    lineHeight: 20,
  },

  // Aguardando
  aguardandoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  aguardandoEmoji: {
    fontSize: 40,
    marginBottom: spacing.lg,
  },
  aguardandoTitle: {
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  aguardandoSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Personal atual
  personalAtualCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  personalNome: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  personalSpecialty: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#999999',
  },
  trocarBtn: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  trocarBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
});
