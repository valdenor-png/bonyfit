import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

// ─── TYPES ──────────────────────────────────────────────
interface DataCategory {
  icon: string;
  name: string;
  description: string;
}

// ─── MOCK DATA ──────────────────────────────────────────
const DATA_CATEGORIES: DataCategory[] = [
  {
    icon: '👤',
    name: 'Dados pessoais',
    description: 'Nome, CPF, e-mail, telefone',
  },
  {
    icon: '🏋️',
    name: 'Dados de treino',
    description: 'Exercícios, cargas, sessões',
  },
  {
    icon: '📏',
    name: 'Dados corporais',
    description: 'Peso, medidas, fotos',
  },
  {
    icon: '💬',
    name: 'Dados sociais',
    description: 'Posts, mensagens, likes',
  },
  {
    icon: '📱',
    name: 'Dados de acesso',
    description: 'Check-ins, dispositivos',
  },
];

// ─── COMPONENT ──────────────────────────────────────────
export default function LGPDScreen({ navigation }: any) {
  const [exporting, setExporting] = useState(false);

  const handleExportData = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      Alert.alert(
        'Dados exportados',
        'Dados enviados para seu e-mail!',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const handleDeleteAccount = () => {
    Alert.prompt
      ? Alert.prompt(
          'Excluir conta',
          'Digite EXCLUIR para confirmar',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              style: 'destructive',
              onPress: (value?: string) => {
                if (value === 'EXCLUIR') {
                  Alert.alert('Conta excluída', 'Todos os seus dados foram apagados.');
                } else {
                  Alert.alert('Erro', 'Texto incorreto. Digite EXCLUIR para confirmar.');
                }
              },
            },
          ],
          'plain-text'
        )
      : Alert.alert(
          'Excluir conta',
          'Tem certeza que deseja excluir sua conta? Esta ação é irreversível.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Conta excluída', 'Todos os seus dados foram apagados.');
              },
            },
          ]
        );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dados e Privacidade</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Seus dados são protegidos pela Lei Geral de Proteção de Dados (LGPD)
          </Text>
        </View>

        {/* Seus dados */}
        <Text style={styles.sectionTitle}>Seus dados</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportData}
            disabled={exporting}
          >
            <Text style={styles.exportIcon}>📥</Text>
            <View style={styles.exportTextContainer}>
              <Text style={styles.exportTitle}>Exportar meus dados</Text>
              <Text style={styles.exportDescription}>
                Receba um arquivo com todos os seus dados: perfil, treinos, medidas, pontos e posts
              </Text>
            </View>
            {exporting ? (
              <ActivityIndicator color={colors.orange} size="small" />
            ) : (
              <Text style={styles.chevron}>›</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dados coletados */}
        <Text style={styles.sectionTitle}>Dados coletados</Text>
        <View style={styles.card}>
          {DATA_CATEGORIES.map((item, index) => (
            <View
              key={item.name}
              style={[
                styles.dataItem,
                index < DATA_CATEGORIES.length - 1 && styles.dataItemBorder,
              ]}
            >
              <Text style={styles.dataItemIcon}>{item.icon}</Text>
              <View style={styles.dataItemText}>
                <Text style={styles.dataItemName}>{item.name}</Text>
                <Text style={styles.dataItemDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Excluir conta */}
        <Text style={styles.sectionTitle}>Excluir conta</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerIcon}>⚠️</Text>
          <Text style={styles.dangerText}>
            Esta ação é irreversível. Todos os seus dados serão apagados.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  infoIcon: {
    fontSize: 28,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  exportIcon: {
    fontSize: 28,
  },
  exportTextContainer: {
    flex: 1,
  },
  exportTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    marginBottom: 4,
  },
  exportDescription: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 24,
    fontFamily: fonts.bodyBold,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dataItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
  },
  dataItemIcon: {
    fontSize: 24,
  },
  dataItemText: {
    flex: 1,
  },
  dataItemName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    marginBottom: 2,
  },
  dataItemDescription: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  dangerCard: {
    backgroundColor: colors.danger + '15',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  dangerIcon: {
    fontSize: 24,
  },
  dangerText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  bottomSpacer: {
    height: 40,
  },
});
