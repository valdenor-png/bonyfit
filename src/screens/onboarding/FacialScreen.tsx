import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Button from '../../components/Button';

interface Props {
  navigation: any;
  onNext: (imageUri: string) => void;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[progressStyles.bar, { backgroundColor: i <= step ? colors.orange : colors.elevated }]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  bar: { flex: 1, height: 3, borderRadius: 2 },
});

export default function FacialScreen({ navigation, onNext }: Props) {
  const [captured, setCaptured] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleOpenCamera = async () => {
    try {
      // In production, use expo-camera
      // For now, simulate capture
      const { CameraView, useCameraPermissions } = await import('expo-camera');
      Alert.alert(
        'Câmera',
        'Em produção, a câmera frontal será aberta para captura facial.',
        [
          {
            text: 'Simular captura',
            onPress: () => {
              setCaptured(true);
              setImageUri('simulated://facial-capture.jpg');
            },
          },
        ]
      );
    } catch {
      // Fallback: simulate capture
      setCaptured(true);
      setImageUri('simulated://facial-capture.jpg');
    }
  };

  const handleContinue = () => {
    if (captured && imageUri) {
      onNext(imageUri);
      navigation.navigate('Contrato');
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={4} total={6} />
      <View style={styles.content}>
        <Text style={styles.title}>Captura facial</Text>
        <Text style={styles.subtitle}>
          Sua foto será usada na catraca para entrada na academia
        </Text>

        <View style={styles.cameraArea}>
          <View style={[styles.circle, captured && styles.circleCaptured]}>
            {captured ? (
              <View style={styles.capturedContent}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
            ) : (
              <>
                {/* Corner lines */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Text style={styles.faceIcon}>👤</Text>
              </>
            )}
          </View>

          {captured ? (
            <View style={styles.capturedBadge}>
              <Text style={styles.capturedText}>✓ Capturado!</Text>
            </View>
          ) : (
            <Text style={styles.instructions}>
              Boa iluminação • Sem óculos escuros • Olhe direto
            </Text>
          )}

          {captured && (
            <View style={styles.sentBadge}>
              <Text style={styles.sentText}>Foto enviada para a catraca</Text>
            </View>
          )}
        </View>

        <View style={styles.buttons}>
          <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
          {!captured ? (
            <>
              <Button title="Abrir câmera" onPress={handleOpenCamera} />
              <Button
                title="Pular por enquanto"
                variant="ghost"
                onPress={() => navigation.navigate('Contrato')}
              />
            </>
          ) : (
            <Button title="Continuar" onPress={handleContinue} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between', paddingBottom: spacing.xxl },
  title: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: spacing.xl },
  cameraArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(242, 101, 34, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  circleCaptured: {
    borderStyle: 'solid',
    borderColor: colors.success,
    borderWidth: 3,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.orange,
  },
  cornerTL: { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3 },
  faceIcon: { fontSize: 60 },
  capturedContent: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { fontSize: 60, color: colors.success },
  instructions: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  capturedBadge: { marginBottom: spacing.md },
  capturedText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.success },
  sentBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  sentText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.success },
  buttons: { gap: spacing.md },
});
