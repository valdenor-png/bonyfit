import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Toggle from '../components/Toggle';
import { supabase } from '../services/supabase';
import { useUI } from '../hooks/useUI';

interface Props {
  navigation: any;
}

interface SettingsRow {
  label: string;
  sub?: string;
  type: 'nav' | 'toggle' | 'danger';
  key: string;
}

const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
  {
    title: 'Conta',
    rows: [
      { label: 'Editar perfil', sub: 'Nome, e-mail, telefone', type: 'nav', key: 'edit_profile' },
      { label: 'Alterar senha', type: 'nav', key: 'change_password' },
      { label: 'Atualizar facial', sub: 'Refazer captura para a catraca', type: 'nav', key: 'update_facial' },
    ],
  },
  {
    title: 'Preferências',
    rows: [
      { label: 'Notificações', type: 'toggle', key: 'notifications' },
      { label: 'Login biométrico', type: 'toggle', key: 'biometric' },
    ],
  },
  {
    title: 'Privacidade',
    rows: [
      { label: 'Mostrar que estou treinando', sub: 'Amigos mútuos podem ver quando você está na academia', type: 'toggle', key: 'mostrar_presenca' },
      { label: 'Perfil privado', sub: 'Ocultar seu perfil do ranking e feed', type: 'toggle', key: 'private_profile' },
      { label: 'Usuários bloqueados', type: 'nav', key: 'blocked_users' },
      { label: 'Dados e privacidade', type: 'nav', key: 'data_privacy' },
    ],
  },
  {
    title: 'Plano',
    rows: [
      { label: 'Meu plano', sub: 'Trimestral — R$ 69,90/mês', type: 'nav', key: 'my_plan' },
      { label: 'Histórico financeiro', type: 'nav', key: 'payment_history' },
      { label: 'Meu contrato', type: 'nav', key: 'my_contract' },
    ],
  },
];

export default function SettingsScreen({ navigation }: Props) {
  const { confirm } = useUI();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notifications: true,
    biometric: false,
    private_profile: false,
    mostrar_presenca: true,
  });

  const handleToggle = async (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

    if (key === 'mostrar_presenca') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').update({ mostrar_presenca: !toggles[key] }).eq('id', user.id);
        }
      } catch {}
    }
  };

  const handleSignOut = async () => {
    const logout = await confirm({
      icon: 'logout',
      title: 'Sair da conta',
      message: 'Tem certeza que deseja sair?',
      confirmLabel: 'Sair',
      confirmVariant: 'danger',
    });
    if (logout) supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, i) => (
                <TouchableOpacity
                  key={row.key}
                  style={[
                    styles.row,
                    i < section.rows.length - 1 && styles.rowBorder,
                  ]}
                  onPress={() => {
                    if (row.type === 'toggle') handleToggle(row.key);
                  }}
                  activeOpacity={row.type === 'toggle' ? 1 : 0.7}
                >
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    {row.sub && <Text style={styles.rowSub}>{row.sub}</Text>}
                  </View>
                  {row.type === 'nav' && (
                    <Text style={styles.chevron}>›</Text>
                  )}
                  {row.type === 'toggle' && (
                    <Toggle
                      value={toggles[row.key] ?? false}
                      onValueChange={() => handleToggle(row.key)}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Rever tour */}
        <TouchableOpacity
          style={styles.tourBtn}
          onPress={() => navigation.navigate('Home', { screen: 'HomeMain', params: { forceTour: true } })}
          activeOpacity={0.7}
        >
          <Text style={styles.tourBtnText}>🎓 Rever tour do app</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Bony Fit App v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  backText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.orange },
  headerTitle: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.xxl },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.elevated },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text },
  rowSub: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted },
  tourBtn: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(242,101,34,0.08)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(242,101,34,0.20)',
    padding: spacing.lg,
    alignItems: 'center',
  },
  tourBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  signOutBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.danger },
  version: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
