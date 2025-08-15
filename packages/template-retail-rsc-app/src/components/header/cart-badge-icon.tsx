'use client';

import type { ReactElement } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/providers/cart-store';
import { Badge } from '@/components/ui/badge';

export default function CartBadgeIcon(): ReactElement {
    // Use shallow equality check to prevent unnecessary re-renders
    const { cart } = useCartStore(
        useShallow((state) => ({
            cart: state.cart
        }))
    );

    return (
        <>
            <ShoppingCart className="size-6" />
            <Badge
                variant="destructive"
                className="h-4 min-w-4 rounded-full px-1 font-mono tabular-num"
            >
                {cart?.productItems?.length ?? 0}
            </Badge>
        </>
    );
}
