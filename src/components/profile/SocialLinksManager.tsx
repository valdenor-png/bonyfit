import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CrossPlatformModal from '../ui/CrossPlatformModal';
import { colors, fonts, spacing, radius } from '../../tokens';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { SOCIAL_NETWORKS, SocialNetwork } from '../../constants/socialNetworks';

interface SocialLink {
  id: string;
  user_id: string;
  network_id: string;
  url: string;
  display_order: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

type ManagerStep = 'list' | 'pick' | 'input';

export default function SocialLinksManager({ visible, onClose, userId }: Props) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<ManagerStep>('list');
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadLinks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_social_links')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');
      if (!error && data) {
        setLinks(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      loadLinks();
      setStep('list');
      setSelectedNetwork(null);
      setUrlInput('');
    }
  }, [visible, loadLinks]);

  const availableNetworks = SOCIAL_NETWORKS.filter(
    (n) => !links.some((l) => l.network_id === n.id)
  );

  const handleRemove = (link: SocialLink) => {
    const network = SOCIAL_NETWORKS.find((n) => n.id === link.network_id);
    Alert.alert(
      'Remover',
      `Remover ${network?.name || link.network_id}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_social_links')
                .delete()
                .eq('id', link.id);
              if (error) throw error;
              await loadLinks();
            } catch {
              Alert.alert('Erro', 'Nao foi possivel remover o link.');
            }
          },
        },
      ]
    );
  };

  const handleSelectNetwork = (network: SocialNetwork) => {
    setSelectedNetwork(network);
    setUrlInput('');
    setStep('input');
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSaveLink = async () => {
    if (!selectedNetwork) return;
    const trimmed = urlInput.trim();
    if (!trimmed) {
      Alert.alert('Erro', 'Insira a URL do seu perfil.');
      return;
    }
    if (!isValidUrl(trimmed)) {
      Alert.alert('URL inválida', 'Insira uma URL válida (ex: https://instagram.com/seu_perfil)');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('user_social_links').insert({
        user_id: userId,
        network_id: selectedNetwork.id,
        url: trimmed,
        display_order: links.length,
      });
      if (error) throw error;
      await loadLinks();
      setStep('list');
      setSelectedNetwork(null);
      setUrlInput('');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar o link.');
    } finally {
      setSaving(false);
    }
  };

  const renderList = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Redes Sociais</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Fechar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView style={styles.listScroll}>
          {links.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma rede social adicionada.</Text>
          )}
          {links.map((link) => {
            const network = SOCIAL_NETWORKS.find((n) => n.id === link.network_id);
            return (
              <View key={link.id} style={styles.linkRow}>
                <View style={[styles.linkIcon, { backgroundColor: (network?.color || '#999') + '33' }]}>
                  <Text style={styles.linkEmoji}>{network?.emoji || '?'}</Text>
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkName}>{network?.name || link.network_id}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(link)}
                >
                  <Text style={styles.removeBtnText}>{'×'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {availableNetworks.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setStep('pick')}
        >
          <Text style={styles.addButtonText}>Adicionar rede social</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderPicker = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('list')}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Fechar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Escolha uma rede social</Text>

      <View style={styles.networkGrid}>
        {availableNetworks.map((network) => (
          <TouchableOpacity
            key={network.id}
            style={styles.networkItem}
            onPress={() => handleSelectNetwork(network)}
          >
            <View style={[styles.networkCircle, { backgroundColor: network.color + '33' }]}>
              <Text style={styles.networkEmoji}>{network.emoji}</Text>
            </View>
            <Text style={styles.networkName} numberOfLines={1}>{network.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderInput = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('pick')}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Fechar</Text>
        </TouchableOpacity>
      </View>

      {selectedNetwork && (
        <View style={styles.inputSection}>
          <View style={styles.selectedHeader}>
            <View style={[styles.networkCircle, { backgroundColor: selectedNetwork.color + '33' }]}>
              <Text style={styles.networkEmoji}>{selectedNetwork.emoji}</Text>
            </View>
            <Text style={styles.selectedName}>{selectedNetwork.name}</Text>
          </View>

          <Text style={styles.inputLabel}>URL do perfil</Text>
          <TextInput
            style={styles.urlInput}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder={selectedNetwork.placeholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveLink}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <CrossPlatformModal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {step === 'list' && renderList()}
          {step === 'pick' && renderPicker()}
          {step === 'input' && renderInput()}
        </View>
      </View>
    </CrossPlatformModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#141414',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  closeBtn: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  backBtn: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },

  /* List */
  listScroll: {
    maxHeight: 300,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  linkEmoji: {
    fontSize: 16,
  },
  linkInfo: {
    flex: 1,
  },
  linkName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(231,76,60,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  removeBtnText: {
    fontSize: 18,
    color: colors.danger,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  /* Picker */
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'flex-start',
  },
  networkItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  networkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  networkEmoji: {
    fontSize: 20,
  },
  networkName: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* Input */
  inputSection: {
    paddingTop: spacing.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  selectedName: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginLeft: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  urlInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  saveButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
});
