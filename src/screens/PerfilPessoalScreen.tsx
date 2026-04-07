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
import Skull from '../components/Skull';
import { supabase } from '../services/supabase';

interface Props {
  navigation: any;
}

const MOCK_USER = {
  name: 'Usuario Teste',
  email: 'teste@bonyfit.com',
  cpf: '055.298.972-07',
  phone: '(91) 99999-9999',
  level: 'Ouro',
  memberSince: 'Abril 2026',
  plan: 'Trimestral',
  planPrice: 'R$ 69,90/mês',
  unit: 'Bony Fit — Centro',
};

export default function PerfilPessoalScreen({ navigation }: Props) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notifications: true,
    biometric: false,
    private_profile: false,
  });

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { supabase.auth.signOut(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {MOCK_USER.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{MOCK_USER.name}</Text>
          <Text style={styles.memberSince}>Membro desde {MOCK_USER.memberSince}</Text>
          <View style={styles.levelBadge}>
            <Skull size={14} color={colors.orange} />
            <Text style={styles.levelText}>{MOCK_USER.level}</Text>
          </View>
        </View>

        {/* Dados pessoais */}
        <Section title="Dados pessoais">
          <InfoRow label="Nome" value={MOCK_USER.name} />
          <InfoRow label="E-mail" value={MOCK_USER.email} />
          <InfoRow label="CPF" value={MOCK_USER.cpf} />
          <InfoRow label="Telefone" value={MOCK_USER.phone} />
          <NavRow label="Editar dados" onPress={() => navigation.navigate('EditarPerfil')} />
        </Section>

        {/* Segurança */}
        <Section title="Segurança">
          <NavRow label="Alterar senha" onPress={() => Alert.alert('Alterar senha', 'Funcionalidade em desenvolvimento.')} />
          <NavRow label="Atualizar facial" sub="Refazer captura para a catraca" onPress={() => Alert.alert('Facial', 'Funcionalidade em desenvolvimento.')} />
          <ToggleRow label="Login biométrico" value={toggles.biometric} onToggle={() => handleToggle('biometric')} />
        </Section>

        {/* Privacidade */}
        <Section title="Privacidade">
          <ToggleRow label="Perfil privado" sub="Ocultar do ranking e feed" value={toggles.private_profile} onToggle={() => handleToggle('private_profile')} />
          <ToggleRow label="Notificações" value={toggles.notifications} onToggle={() => handleToggle('notifications')} />
          <NavRow label="Usuários bloqueados" onPress={() => Alert.alert('Bloqueados', 'Funcionalidade em desenvolvimento.')} />
          <NavRow label="Dados e privacidade" onPress={() => navigation.navigate('LGPD')} />
        </Section>

        {/* Plano e pagamentos */}
        <Section title="Plano e pagamentos">
          <InfoRow label="Plano atual" value={`${MOCK_USER.plan} — ${MOCK_USER.planPrice}`} />
          <InfoRow label="Unidade" value={MOCK_USER.unit} />
          <NavRow label="Histórico financeiro" onPress={() => navigation.navigate('HistoricoFinanceiro')} />
          <NavRow label="Meu contrato" onPress={() => Alert.alert('Contrato', 'Funcionalidade em desenvolvimento.')} />
        </Section>

        {/* Sair */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Bony Fit App v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// --- Sub-components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function NavRow({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, sub, value, onToggle }: { label: string; sub?: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Toggle value={value} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.orange },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  profileSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 28, fontFamily: fonts.bodyBold, color: colors.orange },
  name: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.xs },
  memberSince: { fontSize: 13, fontFamily: fonts.body, color: colors.textMuted, marginBottom: spacing.md },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  levelText: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.orange },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 11,
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text },
  rowValue: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'right', maxWidth: '55%' },
  rowSub: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 20, color: colors.textMuted },
  signOutBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signOutText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.danger },
  version: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
