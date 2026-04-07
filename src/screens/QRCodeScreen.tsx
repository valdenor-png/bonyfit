import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

type TabKey = 'my_qr' | 'scan';

const RECENT_SCANNED = [
  { id: '1', name: 'Carlos P.', initials: 'CP', level: 12 },
  { id: '2', name: 'Juliana F.', initials: 'JF', level: 8 },
  { id: '3', name: 'Ana M.', initials: 'AM', level: 15 },
];

interface Props {
  navigation: any;
}

export default function QRCodeScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('my_qr');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu QR Code</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'my_qr' as TabKey, label: 'Meu QR' },
          { key: 'scan' as TabKey, label: 'Escanear' },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'my_qr' ? (
          <View style={styles.myQrContent}>
            {/* QR Code placeholder */}
            <View style={styles.qrWrapper}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR</Text>
                <View style={styles.qrGrid}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.qrBlock,
                        { opacity: [0, 2, 4, 6, 8].includes(i) ? 1 : 0.3 },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.qrHint}>
              Mostre este codigo para adicionar amigos
            </Text>

            {/* User info */}
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>VS</Text>
              </View>
              <View>
                <Text style={styles.userName}>Voce</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Level 10</Text>
                </View>
              </View>
            </View>

            {/* Share button */}
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7} onPress={() => Alert.alert('Compartilhar', 'Link copiado!')}>
              <Text style={styles.shareBtnText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scanContent}>
            {/* Camera viewfinder placeholder */}
            <View style={styles.viewfinder}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.viewfinderText}>Câmera</Text>
            </View>

            <Text style={styles.scanHint}>
              Aponte para o QR Code de um amigo
            </Text>

            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.7} onPress={() => Alert.alert('Câmera', 'Escanear QR Code')}>
              <Text style={styles.cameraBtnText}>Abrir câmera</Text>
            </TouchableOpacity>

            {/* Recently scanned */}
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Escaneados recentemente</Text>
              {RECENT_SCANNED.map((user) => (
                <View key={user.id} style={styles.recentItem}>
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>{user.initials}</Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{user.name}</Text>
                    <Text style={styles.recentLevel}>Level {user.level}</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn}>
                    <Text style={styles.addBtnText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CORNER_SIZE = 30;
const CORNER_BORDER = 3;

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
    paddingTop: 50,
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
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  // My QR tab
  myQrContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 32,
    fontFamily: fonts.numbersExtraBold,
    color: colors.bg,
    marginBottom: spacing.sm,
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 90,
    gap: 6,
    justifyContent: 'center',
  },
  qrBlock: {
    width: 24,
    height: 24,
    backgroundColor: colors.bg,
    borderRadius: 4,
  },
  qrHint: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  levelBadge: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: 11,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  shareBtn: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  // Scan tab
  scanContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  viewfinder: {
    width: 260,
    height: 260,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
  viewfinderText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  scanHint: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cameraBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  cameraBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  // Recent scanned
  recentSection: {
    width: '100%',
  },
  recentTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentAvatarText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  recentLevel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  addBtn: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
});
