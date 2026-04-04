import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';

interface Props {
  onIndicadorSelecionado: (id: string | null) => void;
}

interface MockPerson {
  id: string;
  nome: string;
}

const MOCK_RESULTS: MockPerson[] = [
  { id: 'u1', nome: 'Carlos Eduardo Silva' },
  { id: 'u2', nome: 'Fernanda Oliveira' },
  { id: 'u3', nome: 'Rafael Mendes Costa' },
];

function getInitials(name: string): string {
  const parts = name.split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function CampoIndicacao({ onIndicadorSelecionado }: Props) {
  const [foiIndicado, setFoiIndicado] = useState<boolean | null>(null);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<MockPerson | null>(null);

  const showResults = foiIndicado === true && !selecionado && busca.length >= 3;

  const handleSelect = (person: MockPerson) => {
    setSelecionado(person);
    setBusca('');
    onIndicadorSelecionado(person.id);
  };

  const handleReset = () => {
    setSelecionado(null);
    setBusca('');
    onIndicadorSelecionado(null);
  };

  const handleToggle = (value: boolean) => {
    setFoiIndicado(value);
    if (!value) {
      setSelecionado(null);
      setBusca('');
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

          {showResults && (
            <View style={styles.resultsContainer}>
              {MOCK_RESULTS.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.resultItem}
                  onPress={() => handleSelect(person)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{getInitials(person.nome)}</Text>
                  </View>
                  <Text style={styles.resultName}>{person.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {foiIndicado === true && selecionado && (
        <View style={styles.confirmationRow}>
          <Text style={styles.confirmationText}>
            Indicado por: {selecionado.nome} ✓
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
