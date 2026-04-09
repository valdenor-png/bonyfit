import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { fonts } from '../../tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Tour steps ───────────────────────────────────────────────
const STEPS = [
  {
    title: 'Bem-vindo ao Bony Fit!',
    text: 'Vamos fazer um tour rápido pelas funcionalidades do app.',
    icon: '💀',
    position: 'center' as const,
  },
  {
    title: 'Início',
    text: 'Sua Home! Aqui você vê o treino do dia, desafios da semana e seu progresso de XP.',
    icon: '🏠',
    position: 'bottom' as const,
    tabIndex: 0,
  },
  {
    title: 'Calendário',
    text: 'Toque no ícone do calendário pra ver as aulas e eventos da academia.',
    icon: '📅',
    position: 'top' as const,
  },
  {
    title: 'Feed',
    text: 'A rede social da academia! Veja os treinos dos colegas, curta e compartilhe.',
    icon: '📱',
    position: 'bottom' as const,
    tabIndex: 1,
  },
  {
    title: 'Treino',
    text: 'O coração do app! Toque aqui pra iniciar seu treino e registrar séries.',
    icon: '💀',
    position: 'bottom' as const,
    tabIndex: 2,
  },
  {
    title: 'Loja',
    text: 'Suplementos, roupas e o açaí da Bone. Tudo aqui na loja.',
    icon: '🛒',
    position: 'bottom' as const,
    tabIndex: 3,
  },
  {
    title: 'Menu',
    text: 'Perfil, ranking, frequência, configurações e mais. Tudo no Menu.',
    icon: '☰',
    position: 'bottom' as const,
    tabIndex: 4,
  },
  {
    title: 'Pronto!',
    text: 'Agora é com você. Bora treinar! 💪🔥',
    icon: '🏆',
    position: 'center' as const,
  },
];

interface Props {
  visible: boolean;
  onFinish: () => void;
}

export default function OnboardingTour({ visible, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, speed: 14, bounciness: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const animateTransition = (next: number) => {
    Animated.timing(cardScale, { toValue: 0.9, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.spring(cardScale, { toValue: 1, speed: 14, bounciness: 4, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onFinish);
    } else {
      animateTransition(step + 1);
    }
  };

  const handleSkip = () => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onFinish);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {/* Backdrop */}
      <View style={styles.backdrop} />

      {/* Tooltip card */}
      <Animated.View style={[
        styles.card,
        current.position === 'bottom' && styles.cardTop,
        current.position === 'top' && styles.cardBottom,
        current.position === 'center' && styles.cardCenter,
        { transform: [{ scale: cardScale }] },
      ]}>
        {/* Icon */}
        <Text style={styles.icon}>{current.icon}</Text>

        {/* Title */}
        <Text style={styles.title}>{current.title}</Text>

        {/* Text */}
        <Text style={styles.text}>{current.text}</Text>

        {/* Step indicator */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Pular</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              {isFirst ? 'Começar' : isLast ? 'Vamos lá! 💪' : 'Próximo'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tab highlight indicator */}
      {current.tabIndex != null && (
        <View style={[styles.tabHighlight, { left: getTabX(current.tabIndex) }]}>
          <View style={styles.tabHighlightDot} />
        </View>
      )}
    </Animated.View>
  );
}

function getTabX(tabIndex: number): number {
  const tabWidth = SCREEN_W / 5;
  return tabWidth * tabIndex + tabWidth / 2 - 20;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },

  // Card positions
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242,101,34,0.3)',
    padding: 24,
    alignItems: 'center',
  },
  cardTop: {
    top: 140,
  },
  cardBottom: {
    bottom: 140,
  },
  cardCenter: {
    top: SCREEN_H / 2 - 140,
  },

  // Content
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.numbersBold,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#F26522',
    width: 18,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  nextBtn: {
    backgroundColor: '#F26522',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  nextBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Tab highlight
  tabHighlight: {
    position: 'absolute',
    bottom: 90,
    width: 40,
    alignItems: 'center',
  },
  tabHighlightDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F26522',
    backgroundColor: 'rgba(242,101,34,0.15)',
  },
});
