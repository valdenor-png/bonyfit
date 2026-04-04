import { create } from 'zustand';

interface CartItem {
  produtoId: string;
  variacaoId: string | null;
  variacaoNome: string;
  nome: string;
  precoUnitarioCentavos: number;
  quantidade: number;
  imagemUrl: string | null;
}

interface LojaStore {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantidade'>) => void;
  removeFromCart: (produtoId: string, variacaoId: string | null) => void;
  updateQuantidade: (produtoId: string, variacaoId: string | null, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useLojaStore = create<LojaStore>((set, get) => ({
  cart: [],

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (c) => c.produtoId === item.produtoId && c.variacaoId === item.variacaoId
      );
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.produtoId === item.produtoId && c.variacaoId === item.variacaoId
              ? { ...c, quantidade: c.quantidade + 1 }
              : c
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantidade: 1 }] };
    }),

  removeFromCart: (produtoId, variacaoId) =>
    set((state) => ({
      cart: state.cart.filter(
        (c) => !(c.produtoId === produtoId && c.variacaoId === variacaoId)
      ),
    })),

  updateQuantidade: (produtoId, variacaoId, qty) =>
    set((state) => ({
      cart:
        qty <= 0
          ? state.cart.filter(
              (c) => !(c.produtoId === produtoId && c.variacaoId === variacaoId)
            )
          : state.cart.map((c) =>
              c.produtoId === produtoId && c.variacaoId === variacaoId
                ? { ...c, quantidade: qty }
                : c
            ),
    })),

  clearCart: () => set({ cart: [] }),

  getTotal: () =>
    get().cart.reduce((sum, item) => sum + item.precoUnitarioCentavos * item.quantidade, 0),

  getItemCount: () =>
    get().cart.reduce((sum, item) => sum + item.quantidade, 0),
}));
