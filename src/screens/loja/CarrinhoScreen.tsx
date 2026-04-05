import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useLojaStore } from '../../stores/lojaStore';

// ─── Helpers ────────────────────────────────────────────────────
const formatPrice = (centavos: number) =>
  'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');

// ─── Cart Item Card ─────────────────────────────────────────────
function CartItemCard({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: {
    produtoId: string;
    variacaoId: string | null;
    variacaoNome: string;
    nome: string;
    precoUnitarioCentavos: number;
    quantidade: number;
    imagemUrl: string | null;
  };
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const subtotal = item.precoUnitarioCentavos * item.quantidade;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemRow}>
        {/* Emoji placeholder */}
        <View style={styles.itemImage}>
          <Text style={styles.itemEmoji}>📦</Text>
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.nome}
          </Text>
          {item.variacaoNome ? (
            <Text style={styles.itemVariation}>{item.variacaoNome}</Text>
          ) : null}
          <Text style={styles.itemUnitPrice}>
            {formatPrice(item.precoUnitarioCentavos)}
          </Text>
        </View>

        {/* Remove */}
        <TouchableOpacity onPress={onRemove} activeOpacity={0.6} style={styles.removeBtn}>
          <Text style={styles.removeIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity + Subtotal */}
      <View style={styles.itemBottom}>
        <View style={styles.qtyControls}>
          <TouchableOpacity
            onPress={() => onUpdateQty(item.quantidade - 1)}
            activeOpacity={0.7}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantidade}</Text>
          <TouchableOpacity
            onPress={() => onUpdateQty(item.quantidade + 1)}
            activeOpacity={0.7}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.itemSubtotal}>{formatPrice(subtotal)}</Text>
      </View>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────
interface Props {
  navigation: any;
}

export default function CarrinhoScreen({ navigation }: Props) {
  const { user } = useAuth();
  const cart = useLojaStore((s) => s.cart);
  const updateQuantidade = useLojaStore((s) => s.updateQuantidade);
  const removeFromCart = useLojaStore((s) => s.removeFromCart);
  const clearCart = useLojaStore((s) => s.clearCart);
  const getTotal = useLojaStore((s) => s.getTotal);
  const getItemCount = useLojaStore((s) => s.getItemCount);

  const total = getTotal();
  const itemCount = getItemCount();

  const handleFinalizarPedido = async () => {
    if (!user) {
      Alert.alert('Erro', 'Voce precisa estar logado para finalizar o pedido.');
      return;
    }

    try {
      const { error } = await supabase.from('loja_pedidos').insert({
        user_id: user.id,
        itens: JSON.stringify(cart),
        total,
        status: 'pendente',
      });

      if (error) throw error;

      clearCart();
      Alert.alert('Pedido realizado!', 'Retire na recepcao.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Erro', 'Nao foi possivel finalizar o pedido. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Carrinho</Text>
          {itemCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{itemCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {cart.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Seu carrinho esta vazio</Text>
          <Text style={styles.emptySubtitle}>
            Adicione produtos da loja para continuar
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>Voltar a loja</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart items */}
          <FlatList
            data={cart}
            keyExtractor={(item) => `${item.produtoId}-${item.variacaoId}`}
            renderItem={({ item }) => (
              <CartItemCard
                item={item}
                onUpdateQty={(qty) =>
                  updateQuantidade(item.produtoId, item.variacaoId, qty)
                }
                onRemove={() => removeFromCart(item.produtoId, item.variacaoId)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleFinalizarPedido}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutBtnText}>Finalizar pedido</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 54,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerBadge: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  emptyBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // List
  listContent: {
    paddingVertical: spacing.md,
    paddingBottom: 180,
  },
  separator: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: spacing.xl,
  },

  // Item card
  itemCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemEmoji: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  itemVariation: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
    marginTop: 2,
  },
  removeBtn: {
    paddingLeft: spacing.md,
  },
  removeIcon: {
    fontSize: 18,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingLeft: 56,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  qtyValue: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 15,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },

  // Bottom section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 34,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subtotalLabel: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  subtotalValue: {
    fontSize: 20,
    fontFamily: fonts.numbersExtraBold,
    color: colors.text,
  },
  checkoutBtn: {
    height: 52,
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
