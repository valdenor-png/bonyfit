import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Prata: '#C0C0C0',
  Ouro: '#FFD700',
  Platina: '#3B82F6',
  Diamante: '#A855F7',
  Master: '#E74C3C',
};

const UNITS = [
  { id: 'centro', name: 'Centro' },
  { id: 'jaderlandia', name: 'Jaderlandia' },
  { id: 'nova-olinda', name: 'Nova Olinda' },
  { id: 'apeu', name: 'Apeu' },
  { id: 'icui', name: 'Icui' },
];

const BIO_MAX = 150;

interface Props {
  navigation: any;
}

export default function EditarPerfilScreen({ navigation }: Props) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('centro');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const level = user?.level || 'Bronze';
  const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS.Bronze;
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // ── Load bio from Supabase ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('bio, unit_id')
        .eq('id', user.id)
        .single();
      if (data) {
        if (data.bio) setBio(data.bio);
        if (data.unit_id) setSelectedUnit(data.unit_id);
      }
    })();
  }, [user?.id]);

  // ── Pick image ──────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao', 'Precisamos de acesso a galeria para alterar sua foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setAvatarUri(asset.uri);

    // Upload to Supabase storage
    if (!user?.id) return;
    setUploading(true);
    try {
      const ext = asset.uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${ext}`,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (publicData?.publicUrl) {
        setAvatarUri(publicData.publicUrl);
      }
    } catch (err: any) {
      Alert.alert('Erro', 'Nao foi possivel enviar a foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id) return;
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome nao pode ficar vazio.');
      return;
    }

    setSaving(true);
    try {
      // Get auth user directly
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = user?.id || authUser?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      // Build update payload — only non-null fields
      const payload: Record<string, any> = { name: name.trim() };
      if (bio.trim()) payload.bio = bio.trim();
      if (selectedUnit) payload.unit_id = selectedUnit;
      if (avatarUri) payload.avatar_url = avatarUri;

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId);

      if (error) throw error;

      // Sync auth store
      try { await updateProfile({ name: name.trim(), avatar_url: avatarUri }); } catch {}

      if (Platform.OS === 'web') {
        window.alert('Perfil salvo!');
      } else {
        Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
      }
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível salvar.';
      if (Platform.OS === 'web') window.alert('Erro: ' + msg);
      else Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Header buttons ──────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: spacing.lg }}>
          <Text style={{ fontSize: 16, color: colors.text }}>Cancelar</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ paddingRight: spacing.lg }}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.orange} />
          ) : (
            <Text style={{ fontSize: 16, fontFamily: fonts.bodyBold, color: colors.orange }}>
              Salvar
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, name, bio, selectedUnit, avatarUri, saving]);

  const selectedUnitName = UNITS.find((u) => u.id === selectedUnit)?.name || 'Centro';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Avatar ──────────────────────────────────────── */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickImage} disabled={uploading}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: levelColor }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { borderColor: levelColor, backgroundColor: levelColor + '33' }]}>
              <Text style={[styles.avatarInitials, { color: levelColor }]}>{initials}</Text>
            </View>
          )}
          {uploading ? (
            <ActivityIndicator size="small" color={colors.orange} style={{ marginTop: spacing.sm }} />
          ) : (
            <Text style={styles.changePhotoText}>Alterar foto</Text>
          )}
        </TouchableOpacity>

        {/* ── Name ────────────────────────────────────────── */}
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
        />

        {/* ── Bio ─────────────────────────────────────────── */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Bio</Text>
          <Text style={[styles.counter, bio.length >= BIO_MAX && styles.counterLimit]}>
            {bio.length}/{BIO_MAX}
          </Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={(t) => {
            if (t.length <= BIO_MAX) setBio(t);
          }}
          placeholder="Conte um pouco sobre voce..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={BIO_MAX}
        />

        {/* ── Unit ────────────────────────────────────────── */}
        <Text style={styles.label}>Unidade</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowUnitPicker(!showUnitPicker)}
        >
          <Text style={styles.dropdownText}>{selectedUnitName}</Text>
          <Text style={styles.dropdownArrow}>{showUnitPicker ? '\u25B2' : '\u25BC'}</Text>
        </TouchableOpacity>

        {showUnitPicker && (
          <View style={styles.unitList}>
            {UNITS.map((unit) => (
              <TouchableOpacity
                key={unit.id}
                style={[
                  styles.unitItem,
                  selectedUnit === unit.id && styles.unitItemActive,
                ]}
                onPress={() => {
                  setSelectedUnit(unit.id);
                  setShowUnitPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.unitItemText,
                    selectedUnit === unit.id && styles.unitItemTextActive,
                  ]}
                >
                  {unit.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 60,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl + 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 34,
    fontFamily: fonts.bodyBold,
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
    marginTop: spacing.sm,
  },

  /* Form */
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  counter: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  counterLimit: {
    color: colors.danger,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },

  /* Unit dropdown */
  dropdown: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.text,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.textMuted,
  },
  unitList: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  unitItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  unitItemActive: {
    backgroundColor: colors.orange + '15',
  },
  unitItemText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
  },
  unitItemTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
});
