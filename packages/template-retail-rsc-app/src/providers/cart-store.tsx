'use client';

import {
    createContext,
    type PropsWithChildren,
    useContext,
    useRef
} from 'react';
import { useStore } from 'zustand';
import type { ShopperBasketsTypes } from 'commerce-sdk-isomorphic';
import { type CartStore, createCartStore } from '@/stores/cart-store';

export type CartStoreApi = ReturnType<typeof createCartStore>;

const CartStoreContext = createContext<CartStoreApi | undefined>(undefined);

const CartStoreProvider = ({
    children,
    initialValue
}: PropsWithChildren<{ initialValue?: ShopperBasketsTypes.Basket }>) => {
    const storeRef = useRef<CartStoreApi | null>(null);
    if (storeRef.current === null) {
        storeRef.current = createCartStore({ cart: initialValue });
    }

    return (
        <CartStoreContext.Provider value={storeRef.current}>
            {children}
        </CartStoreContext.Provider>
    );
};

export const useCartStore = <T,>(selector: (store: CartStore) => T) => {
    const cartStoreContext = useContext(CartStoreContext);
    if (!cartStoreContext) {
        throw new Error(`useCartStore must be used within CartStoreProvider`);
    }
    return useStore(cartStoreContext, selector);
};

export default CartStoreProvider;
