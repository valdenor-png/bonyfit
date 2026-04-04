import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Button from '../components/Button';

// --- TYPES ---

type ScanState = 'scanning' | 'success' | 'error';

// --- COMPONENT ---

interface Props {
  navigation?: any;
}

const CORNER_SIZE = 32;
const CORNER_BORDER = 3;
const VIEWFINDER_SIZE = 260;

export default function ScanQRAulaScreen({ navigation }: Props) {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualCode, setManualCode] = useState('');

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  // Scan line animation
  useEffect(() => {
    if (scanState !== 'scanning') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scanState]);

  const showResult = (state: ScanState, error?: string) => {
    setScanState(state);
    if (error) setErrorMessage(error);
    resultOpacity.setValue(0);
    Animated.timing(resultOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (state === 'success') {
      setTimeout(() => {
        Animated.timing(resultOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setScanState('scanning'));
      }, 2000);
    }
  };

  const handleSimulate = () => {
    showResult('success');
  };

  const handleSimulateError = () => {
    showResult('error', 'QR invalido');
  };

  const handleManualSubmit = () => {
    if (manualCode.trim().length === 0) return;
    showResult('success');
    setManualCode('');
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, VIEWFINDER_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear QR da Aula</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Viewfinder area */}
      <View style={styles.viewfinderContainer}>
        {scanState === 'scanning' && (
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />

            <Text style={styles.viewfinderText}>Aponte para o QR do professor</Text>
          </View>
        )}

        {scanState === 'success' && (
          <Animated.View style={[styles.resultContainer, { opacity: resultOpacity }]}>
            <View style={styles.successCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.resultTitle}>Presenca confirmada!</Text>
            <Text style={styles.resultSubtitle}>💃 Danca</Text>
          </Animated.View>
        )}

        {scanState === 'error' && (
          <Animated.View style={[styles.resultContainer, { opacity: resultOpacity }]}>
            <View style={styles.errorCircle}>
              <Text style={styles.errorX}>✕</Text>
            </View>
            <Text style={styles.resultTitle}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => setScanState('scanning')}
            >
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Simulate buttons (dev/testing) */}
      <View style={styles.simulateRow}>
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulate}
          activeOpacity={0.7}
        >
          <Text style={styles.simulateBtnText}>Simular scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.simulateBtn, styles.simulateBtnError]}
          onPress={handleSimulateError}
          activeOpacity={0.7}
        >
          <Text style={[styles.simulateBtnText, { color: colors.danger }]}>
            Simular erro
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual code input */}
      <View style={styles.manualSection}>
        <Text style={styles.manualLabel}>Ou digite o codigo manualmente</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="BONY-XXXX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            returnKeyType="go"
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity
            style={styles.manualSubmitBtn}
            onPress={handleManualSubmit}
            activeOpacity={0.7}
          >
            <Text style={styles.manualSubmitText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- STYLES ---

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
    paddingHorizontal: spacing.xl,
    paddingTop: 54,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  // Viewfinder
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: VIEWFINDER_SIZE + 60,
    marginTop: spacing.xl,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: colors.orange,
    borderTopLeftRadius: radius.sm,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: colors.orange,
    borderTopRightRadius: radius.sm,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: colors.orange,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: colors.orange,
    borderBottomRightRadius: radius.sm,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    backgroundColor: colors.orange,
    borderRadius: 1,
  },
  viewfinderText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Result states
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46,204,113,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successCheck: {
    fontSize: 36,
    fontFamily: fonts.bodyBold,
    color: colors.success,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231,76,60,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorX: {
    fontSize: 36,
    fontFamily: fonts.bodyBold,
    color: colors.danger,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultSubtitle: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  // Simulate buttons
  simulateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  simulateBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  simulateBtnError: {
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
    backgroundColor: 'transparent',
  },
  simulateBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  // Manual code
  manualSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  manualLabel: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  manualRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    letterSpacing: 1,
  },
  manualSubmitBtn: {
    height: 48,
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSubmitText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
