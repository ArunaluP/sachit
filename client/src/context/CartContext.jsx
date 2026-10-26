import { createContext, useContext, useEffect, useState } from 'react';

// The cart lives in the browser until the order is placed
const CartContext = createContext(null);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Throws if the requested quantity is more than the stock
  const addItem = (medicine, quantity = 1) => {
    const existing = items.find((i) => i._id === medicine._id);
    const current = existing ? existing.quantity : 0;
    if (current + quantity > medicine.stock) throw new Error(`Only ${medicine.stock} unit(s) available`);

    if (existing) {
      setItems(items.map((i) => (i._id === medicine._id ? { ...i, quantity: current + quantity, stock: medicine.stock } : i)));
    } else {
      const { _id, name, strength, price, stock, requiresPrescription } = medicine;
      setItems([...items, { _id, name, strength, price, stock, requiresPrescription, quantity }]);
    }
  };

  const setQuantity = (id, quantity) => setItems(items.map((i) => (i._id === id ? { ...i, quantity } : i)));
  const removeItem = (id) => setItems(items.filter((i) => i._id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, setQuantity, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
