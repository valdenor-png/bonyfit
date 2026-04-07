import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { colors, fonts, spacing } from '../tokens';

// ─── Reactions ─────────────────────────────────────────────────
const REACTIONS = ['🔥', '💪', '🏆', '❤️', '👏'] as const;
type Reaction = (typeof REACTIONS)[number];

// ─── Types ─────────────────────────────────────────────────────
interface ReactionPickerProps {
  visible: boolean;
  onSelect: (reaction: string) => void;
  onClose: () => void;
  selectedReaction?: string;
}

// ─── Animated Button ───────────────────────────────────────────
function ReactionButton({
  emoji,
  isSelected,
  onPress,
  delay,
}: {
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay,
      tension: 120,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [delay, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.reactionCircle,
          isSelected && styles.reactionSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.reactionEmoji}>{emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Component ─────────────────────────────────────────────────
export default function ReactionPicker({
  visible,
  onSelect,
  onClose,
  selectedReaction,
}: ReactionPickerProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {REACTIONS.map((emoji, index) => (
            <ReactionButton
              key={emoji}
              emoji={emoji}
              isSelected={selectedReaction === emoji}
              onPress={() => onSelect(emoji)}
              delay={index * 50}
            />
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reactionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionSelected: {
    borderWidth: 2,
    borderColor: colors.orange,
    transform: [{ scale: 1.15 }],
  },
  reactionEmoji: {
    fontSize: 22,
  },
});
