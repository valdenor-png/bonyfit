import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { supabase } from '../../services/supabase';

interface Props {
  onIndicadorSelecionado: (id: string | null) => void;
}

interface SearchPerson {
  id: string;
  name: string;
  avatar_url: string | null;
  level: string;
}

const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Prata: '#A0A0A0',
  Ouro: '#DAA520',
  Platina: '#6BB5C9',
  Diamante: '#5B9BD5',
  Master: '#9B59B6',
};

function getInitials(name: string): string {
  const parts = name.split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function CampoIndicacao({ onIndicadorSelecionado }: Props) {
  const [foiIndicado, setFoiIndicado] = useState<boolean | null>(null);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<SearchPerson | null>(null);
  const [results, setResults] = useState<SearchPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (busca.length < 3) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar_url, level')
          .ilike('name', `%${busca}%`)
          .limit(5);

        if (!error && data) {
          setResults(data as SearchPerson[]);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [busca]);

  const showResults = foiIndicado === true && !selecionado && busca.length >= 3;

  const handleSelect = (person: SearchPerson) => {
    setSelecionado(person);
    setBusca('');
    setResults([]);
    onIndicadorSelecionado(person.id);
  };

  const handleReset = () => {
    setSelecionado(null);
    setBusca('');
    setResults([]);
    onIndicadorSelecionado(null);
  };

  const handleToggle = (value: boolean) => {
    setFoiIndicado(value);
    if (!value) {
      setSelecionado(null);
      setBusca('');
      setResults([]);
      onIndicadorSelecionado(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Você foi indicado por alguém?</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, foiIndicado === true && styles.toggleBtnActive]}
          onPress={() => handleToggle(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.toggleText, foiIndicado === true && styles.toggleTextActive]}
          >
            Sim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, foiIndicado === false && styles.toggleBtnActive]}
          onPress={() => handleToggle(false)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.toggleText, foiIndicado === false && styles.toggleTextActive]}
          >
            Não
          </Text>
        </TouchableOpacity>
      </View>

      {foiIndicado === true && !selecionado && (
        <>
          <TextInput
            style={styles.input}
            value={busca}
            onChangeText={setBusca}
            placeholder="Nome completo de quem te indicou"
            placeholderTextColor={colors.textMuted}
          />

          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.orange}
              style={{ marginTop: spacing.sm }}
            />
          )}

          {showResults && !loading && results.length > 0 && (
            <View style={styles.resultsContainer}>
              {results.map((person) => {
                const levelColor = LEVEL_COLORS[person.level] || colors.orange;
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={styles.resultItem}
                    onPress={() => handleSelect(person)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: levelColor + '26' }]}>
                      <Text style={[styles.avatarText, { color: levelColor }]}>
                        {getInitials(person.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{person.name}</Text>
                      <Text style={[styles.resultLevel, { color: levelColor }]}>
                        {person.level}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showResults && !loading && results.length === 0 && (
            <Text style={styles.noResults}>Nenhum usuário encontrado</Text>
          )}
        </>
      )}

      {foiIndicado === true && selecionado && (
        <View style={styles.confirmationRow}>
          <Text style={styles.confirmationText}>
            Indicado por: {selecionado.name} ✓
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.alterarText}>Alterar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  toggleBtnActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  toggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  resultsContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  resultName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  resultLevel: {
    fontSize: 11,
    fontFamily: fonts.body,
    marginTop: 1,
  },
  noResults: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  confirmationRow: {
    backgroundColor: `${colors.success}15`,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmationText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.success,
    flex: 1,
  },
  alterarText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
});
