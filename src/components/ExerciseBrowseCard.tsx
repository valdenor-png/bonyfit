import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { fonts } from '../tokens';

interface Props {
  name: string;
  namePt: string | null;
  muscle: string | null;
  equipment: string | null;
  imageUrl: string | null;
  onPress: () => void;
  onInfoPress?: () => void;
}

export default function ExerciseBrowseCard({
  name,
  namePt,
  muscle,
  equipment,
  imageUrl,
  onPress,
  onInfoPress,
}: Props) {
  const displayName = namePt || name;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>{'\u{1F3CB}\u{FE0F}'}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
        <View style={styles.tags}>
          {muscle ? (
            <View style={styles.tagOrange}>
              <Text style={styles.tagOrangeText}>{muscle}</Text>
            </View>
          ) : null}
          {equipment ? (
            <View style={styles.tagGray}>
              <Text style={styles.tagGrayText}>{equipment}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {onInfoPress && (
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={onInfoPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.infoBtnText}>{'\u{2139}\u{FE0F}'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
  },
  placeholder: {
    width: 80,
    height: 80,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagOrange: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagOrangeText: {
    color: '#F26522',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  tagGray: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagGrayText: {
    color: '#888888',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  infoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoBtnText: {
    fontSize: 18,
  },
});
