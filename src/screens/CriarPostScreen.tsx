import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';

// ─── Helpers ────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches ? matches.map((t) => t.toLowerCase()) : [];
}

// ─── Component ──────────────────────────────────────────────────
interface Props {
  navigation: any;
}

export default function CriarPostScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const userName = user?.name ?? 'Voce';
  const initials = getInitials(userName);
  const canPublish = text.trim().length > 0 && !publishing;

  // ─── Pick image ─────────────────────────────────────────────
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // ─── Publish ────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);

    let imageUrl: string | null = null;

    try {
      // Get user from Supabase Auth directly if useAuth user is null
      const authUser = user || (await supabase.auth.getUser()).data?.user;
      if (!authUser) {
        Alert.alert('Erro', 'Você precisa estar logado para publicar.');
        setPublishing(false);
        return;
      }

      const userId = user?.id || authUser.id;

      // Upload image if selected
      if (selectedImage) {
        const fileName = `${userId}_${Date.now()}.jpg`;
        const response = await fetch(selectedImage);
        const blob = await response.blob();

        if (blob.size > 10 * 1024 * 1024) {
          Alert.alert('Arquivo muito grande', 'A imagem deve ter no máximo 10MB.');
          setPublishing(false);
          return;
        }

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: publicData } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);
          imageUrl = publicData.publicUrl;
        }
      }

      const hashtags = extractHashtags(text);

      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        text: text.trim(),
        image_url: imageUrl,
        post_type: 'manual',
        hashtags: hashtags.length > 0 ? hashtags : null,
      });

      if (error) {
        Alert.alert('Erro ao publicar', error.message);
        return;
      }

      Alert.alert('Publicado!', 'Seu post foi publicado com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Erro', 'Nao foi possivel publicar o post. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Post</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info */}
          <View style={styles.userRow}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <Text style={styles.userName}>{userName}</Text>
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="No que você tá pensando?"
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            textAlignVertical="top"
            maxLength={2000}
          />

          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.imageRemoveBtn}
                onPress={() => setSelectedImage(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.imageRemoveText}>X</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>📷 Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Marcar', 'Funcionalidade em breve.')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>@ Marcar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Tag', 'Funcionalidade em breve.')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}># Tag</Text>
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>📍 Bony Fit — Centro</Text>
          </View>
        </ScrollView>

        {/* Bottom: Publish Button */}
        <View style={styles.bottomBar}>
          <View style={styles.publishRow}>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsBadgeText}>+25 pts</Text>
            </View>
            <TouchableOpacity
              style={[styles.publishBtn, !canPublish && styles.publishBtnDisabled]}
              onPress={handlePublish}
              disabled={!canPublish}
              activeOpacity={0.7}
            >
              <Text style={styles.publishBtnText}>
                {publishing ? 'PUBLICANDO...' : 'PUBLICAR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // User
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  userName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginLeft: 10,
  },

  // Text Input
  textInput: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
    minHeight: 120,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  // Image Preview
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.pill,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },

  // Location
  locationRow: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  locationText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingBottom: 30,
  },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ptsBadge: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ptsBadgeText: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  publishBtn: {
    flex: 1,
    backgroundColor: colors.orange,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    letterSpacing: 1,
  },
});
