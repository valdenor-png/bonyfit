import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import ScreenBackground from '../components/ScreenBackground';
import { supabase } from '../services/supabase';

export default function ExerciseDetailScreen({ navigation, route }: any) {
  const { exerciseId } = route.params;
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
      setExercise(data);
      setLoading(false);
    })();
  }, [exerciseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Exercício não encontrado</Text>
      </View>
    );
  }

  const displayName = exercise.name_pt || exercise.name;
  const mediaUrl = exercise.gif_url || exercise.video_url || exercise.image_url;
  const musclePt = exercise.target_muscle_pt || exercise.body_part_pt || exercise.muscle_group || '';
  const equipPt = exercise.equipment_pt || exercise.equipment || '';
  const cat = exercise.category || '';

  // Parse instructions (could be string with \n or array)
  let instructions: string[] = [];
  if (exercise.instructions_pt && Array.isArray(exercise.instructions_pt) && exercise.instructions_pt.length > 0) {
    instructions = exercise.instructions_pt;
  } else if (exercise.instructions) {
    instructions = typeof exercise.instructions === 'string'
      ? exercise.instructions.split('\n').filter((s: string) => s.trim())
      : Array.isArray(exercise.instructions) ? exercise.instructions : [];
  }

  const secondaryMuscles = exercise.secondary_muscles || [];
  const tips = exercise.tips
    ? (typeof exercise.tips === 'string' ? exercise.tips.split('\n').filter((s: string) => s.trim()) : exercise.tips)
    : [];

  return (
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>

        {/* Media */}
        {mediaUrl ? (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.mediaPlaceholderText}>{'\u{1F3CB}\u{FE0F}'}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{displayName}</Text>

        {/* Meta tags */}
        <View style={styles.metaRow}>
          {musclePt ? <MetaTag label="Músculo" value={musclePt} /> : null}
          {equipPt ? <MetaTag label="Equipamento" value={equipPt} /> : null}
          {cat ? <MetaTag label="Categoria" value={cat} /> : null}
        </View>

        {/* Secondary muscles */}
        {secondaryMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Músculos Secundários</Text>
            <Text style={styles.sectionText}>{secondaryMuscles.join(', ')}</Text>
          </View>
        )}

        {/* Instructions */}
        {instructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Como Executar</Text>
            {instructions.map((step: string, idx: number) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dicas</Text>
            {(Array.isArray(tips) ? tips : [tips]).map((tip: string, idx: number) => (
              <Text key={idx} style={styles.tipText}>{'\u{1F4A1}'} {tip}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaTag}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    fontFamily: fonts.body,
  },

  // Back
  backBtn: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
  },

  // Media
  media: {
    width: '100%',
    height: 280,
    backgroundColor: '#1A1A1A',
  },
  mediaPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholderText: {
    fontSize: 60,
  },

  // Title
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: fonts.numbersBold,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  metaTag: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minWidth: 100,
  },
  metaLabel: {
    color: '#888888',
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    marginBottom: 2,
  },
  metaValue: {
    color: colors.orange,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    marginBottom: 12,
  },
  sectionText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.numbersBold,
  },
  stepText: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  // Tips
  tipText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: fonts.body,
    marginBottom: 8,
    lineHeight: 22,
  },
});
