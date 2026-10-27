import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from './Auth.jsx';
import { useToast } from './Toast.jsx';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);
const EMPTY = { items: [], total: 0, count: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState(EMPTY);

  const refresh = useCallback(async () => {
    if (!user) return setCart(EMPTY);
    try {
      const data = await api('/cart');
      setCart(data && Array.isArray(data.items) ? data : EMPTY);
    } catch {
      setCart(EMPTY);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setQty = useCallback(async (productId, qty) => {
    try {
      setCart(await api('/cart/items', { method: 'PUT', body: { productId, qty } }));
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  }, [toast]);

  const add = useCallback(async (product) => {
    const current = cart.items.find((i) => i.product._id === (product._id || product.id))?.qty || 0;
    if (await setQty(product._id || product.id, current + 1)) toast(`Added ${product.name}`);
  }, [cart, setQty, toast]);

  return <CartCtx.Provider value={{ cart, setQty, add, refresh }}>{children}</CartCtx.Provider>;
}
