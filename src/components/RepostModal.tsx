import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, fonts } from '../tokens';

interface RepostModalProps {
  visible: boolean;
  onClose: () => void;
  onRepost: () => void;
  onQuote: () => void;
  onShareExternal: () => void;
}

interface OptionRowProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function OptionRow({ icon, title, subtitle, onPress }: OptionRowProps) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RepostModal({
  visible,
  onClose,
  onRepost,
  onQuote,
  onShareExternal,
}: RepostModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.handle} />

              <OptionRow
                icon="\uD83D\uDD04"
                title="Repostar"
                subtitle="Compartilhar no seu feed"
                onPress={onRepost}
              />

              <OptionRow
                icon="\u270F\uFE0F"
                title="Citar"
                subtitle="Adicionar comentario"
                onPress={onQuote}
              />

              <OptionRow
                icon="\uD83D\uDCE4"
                title="Compartilhar externo"
                subtitle="WhatsApp, Instagram..."
                onPress={onShareExternal}
              />

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#999',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
});
