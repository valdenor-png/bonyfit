import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Alert,
} from 'react-native';
import { colors, fonts, spacing } from '../../tokens';
import { supabase } from '../../services/supabase';
import { SOCIAL_NETWORKS } from '../../constants/socialNetworks';
import SocialLinksManager from './SocialLinksManager';

interface SocialLink {
  id: string;
  user_id: string;
  network_id: string;
  url: string;
  display_order: number;
}

interface Props {
  userId: string;
  editable?: boolean;
}

function SocialIcon({ link, onPress }: { link: SocialLink; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const network = SOCIAL_NETWORKS.find((n) => n.id === link.network_id);
  if (!network) return null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.iconCircle, { backgroundColor: network.color + '33' }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text style={styles.iconEmoji}>{network.emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SocialIconsBar({ userId, editable = false }: Props) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [managerVisible, setManagerVisible] = useState(false);

  const loadLinks = useCallback(async () => {
    if (!userId) return;
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
    }
  }, [userId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleIconPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o link.');
    });
  };

  if (links.length === 0 && !editable) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {links.map((link) => (
          <SocialIcon
            key={link.id}
            link={link}
            onPress={() => handleIconPress(link.url)}
          />
        ))}
        {editable && links.length < 8 && (
          <TouchableOpacity
            style={styles.addCircle}
            onPress={() => setManagerVisible(true)}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {editable && (
        <SocialLinksManager
          visible={managerVisible}
          onClose={() => {
            setManagerVisible(false);
            loadLinks();
          }}
          userId={userId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 14,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
