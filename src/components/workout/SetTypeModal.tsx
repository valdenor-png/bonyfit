import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import CrossPlatformModal from '../ui/CrossPlatformModal';
import { fonts } from '../../tokens';

interface SetTypeModalProps {
  visible: boolean;
  currentType: string;
  setNumber: number;
  onSelect: (type: string) => void;
  onClose: () => void;
}

const TYPE_OPTIONS: Array<{ key: string; name: string; color: string }> = [
  { key: 'normal',       name: 'Normal',       color: '#F26522' },
  { key: 'aquecimento',  name: 'Aquecimento',  color: '#4A9EDB' },
  { key: 'preparatoria', name: 'Preparatória', color: '#2D9B6E' },
  { key: 'drop',         name: 'Drop Set',     color: '#D4940F' },
  { key: 'rir',          name: 'RIR',          color: '#D85A30' },
];

export default function SetTypeModal({ visible, currentType, setNumber, onSelect, onClose }: SetTypeModalProps) {
  return (
    <CrossPlatformModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View />
      </Pressable>
      <View style={styles.card}>
        <View style={styles.handle} />
        <Text style={styles.title}>Tipo da Série {setNumber}</Text>

        {TYPE_OPTIONS.map((opt) => {
          const selected = currentType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={styles.optionRow}
              onPress={() => onSelect(opt.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { borderColor: opt.color, backgroundColor: selected ? opt.color : 'transparent' }]} />
              <Text style={[styles.optionText, selected && { color: '#F5F5F5' }]}>{opt.name}</Text>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </CrossPlatformModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: '#F5F5F5',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1E1E1E',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
  },
  optionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  checkmark: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: '#F26522',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#888',
  },
});
