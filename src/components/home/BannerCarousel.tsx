import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../../tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40; // 20px padding each side
const AUTO_PLAY_INTERVAL = 4000;

type BannerSlide =
  | {
      type: 'aula';
      titulo: string;
      professor: string;
      unidade: string;
      horario: string;
      maxAlunos: number;
    }
  | {
      type: 'promo' | 'desafio';
      tag: string;
      titulo: string;
      descricao: string;
      ctaLabel: string;
      accentColor: string;
      onPress?: () => void;
    };

interface BannerCarouselProps {
  slides?: BannerSlide[];
  onScanQR?: () => void;
}

const MOCK_SLIDES: BannerSlide[] = [
  {
    type: 'aula',
    titulo: 'Dança',
    professor: 'Prof. Ana',
    unidade: 'Centro',
    horario: '07:00',
    maxAlunos: 20,
  },
  {
    type: 'aula',
    titulo: 'Funcional',
    professor: 'Prof. Carlos',
    unidade: 'Jaderlândia',
    horario: '09:00',
    maxAlunos: 15,
  },
  {
    type: 'promo',
    tag: 'PROMOÇÃO',
    titulo: 'Indique e ganhe',
    descricao: 'Convide um amigo e ganhe 500 pontos extras!',
    ctaLabel: 'Indicar agora',
    accentColor: '#3B82F6',
  },
  {
    type: 'desafio',
    tag: 'DESAFIO',
    titulo: '30 dias de foco',
    descricao: 'Complete 30 treinos e desbloqueie recompensas!',
    ctaLabel: 'Participar',
    accentColor: '#A855F7',
  },
];

export default function BannerCarousel({ slides, onScanQR }: BannerCarouselProps) {
  const data = slides && slides.length > 0 ? slides : MOCK_SLIDES;
  const flatListRef = useRef<FlatList<BannerSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isPaused = useRef(false);

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused.current) return;
      const nextIndex = (activeIndex + 1) % data.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [activeIndex, data.length]);

  const onScrollBeginDrag = useCallback(() => {
    isPaused.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    isPaused.current = false;
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const renderSlide = useCallback(
    ({ item }: { item: BannerSlide }) => {
      if (item.type === 'aula') {
        return renderAulaSlide(item, onScanQR);
      }
      return renderPromoSlide(item);
    },
    [onScanQR]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderSlide}
        keyExtractor={(_, index) => `banner-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.listContent}
        snapToInterval={SLIDE_WIDTH + 12}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SLIDE_WIDTH + 12,
          offset: (SLIDE_WIDTH + 12) * index,
          index,
        })}
      />
      {/* Dots */}
      <View style={styles.dotsRow}>
        {data.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function renderAulaSlide(
  slide: Extract<BannerSlide, { type: 'aula' }>,
  onScanQR?: () => void
) {
  return (
    <View style={[styles.slideWrapper, { width: SLIDE_WIDTH }]}>
      <LinearGradient
        colors={['#1A1A1A', '#2A1A0A']}
        style={[styles.slide, styles.aulaBorder]}
      >
        {/* Glow */}
        <View style={[styles.glow, { backgroundColor: '#F26522' }]} />

        {/* Tag */}
        <Text style={[styles.tag, { color: '#F26522' }]}>AULA DE HOJE</Text>

        {/* Title */}
        <Text style={styles.title}>{slide.titulo}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {slide.professor} · {slide.unidade}
        </Text>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <View style={styles.horarioPill}>
              <Text style={styles.horarioText}>{slide.horario}</Text>
            </View>
            <Text style={styles.maxText}>Máx. {slide.maxAlunos} alunos</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onScanQR}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>Escanear QR</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

function renderPromoSlide(
  slide: Extract<BannerSlide, { type: 'promo' | 'desafio' }>
) {
  const gradientEnd = slide.type === 'desafio' ? '#1A0A2A' : '#0A1A2A';
  const borderColor =
    slide.type === 'desafio'
      ? 'rgba(168, 85, 247, 0.3)'
      : 'rgba(242, 101, 34, 0.2)';

  return (
    <View style={[styles.slideWrapper, { width: SLIDE_WIDTH }]}>
      <LinearGradient
        colors={['#1A1A1A', gradientEnd]}
        style={[styles.slide, { borderWidth: 1, borderColor }]}
      >
        {/* Glow */}
        <View style={[styles.glow, { backgroundColor: slide.accentColor }]} />

        {/* Tag */}
        <Text style={[styles.tag, { color: slide.accentColor }]}>
          {slide.tag}
        </Text>

        {/* Title */}
        <Text style={styles.title}>{slide.titulo}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.descricao}</Text>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft} />
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: slide.accentColor }]}
            onPress={slide.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{slide.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  slideWrapper: {
    marginRight: 12,
  },
  slide: {
    height: 170,
    borderRadius: 14,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  aulaBorder: {
    borderWidth: 1,
    borderColor: 'rgba(242, 101, 34, 0.3)',
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
  },
  tag: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.numbersBold,
    color: '#FFFFFF',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horarioPill: {
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(242, 101, 34, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  horarioText: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: '#F26522',
  },
  maxText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  ctaButton: {
    backgroundColor: '#F26522',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    height: 6,
    backgroundColor: '#F26522',
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
