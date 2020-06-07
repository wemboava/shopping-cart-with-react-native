import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.removeItem('@gomarketplace');
      const productsSaved = await AsyncStorage.getItem('@gomarketplace');

      const productsParsed = productsSaved ? JSON.parse(productsSaved) : [];

      setProducts(productsParsed);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const alreadyExists = products.find(item => item.id === product.id);

      if (alreadyExists) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem('@gomarketplace', JSON.stringify(product));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem('@gomarketplace', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const currentProduct = products.find(p => p.id === id) as Product;

      let newProducts: Product[] = [];

      if (currentProduct?.quantity > 1) {
        newProducts = products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        );
      } else {
        newProducts = [...products];
      }

      setProducts(newProducts);

      await AsyncStorage.setItem('@gomarketplace', JSON.stringify(newProducts));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
