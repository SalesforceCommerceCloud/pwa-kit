/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useFetcher } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import type { ShopperProductsTypes } from 'commerce-sdk-isomorphic';
import { useCartStore } from '@/providers/cart-store';
import { useToast } from '@/components/ui/toast';

interface ProductSelectionValues {
    product: ShopperProductsTypes.Product;
    variant: any;
    quantity: number;
}

interface UseProductActionsProps {
    product: ShopperProductsTypes.Product;
    isProductASet?: boolean;
    isProductABundle?: boolean;
}

export function useProductActions({
    product,
    isProductASet: _isProductASet = false, // Prefix with underscore to indicate intentionally unused
    isProductABundle: _isProductABundle = false // Prefix with underscore to indicate intentionally unused
}: UseProductActionsProps) {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    // Note: isProductASet, isProductABundle, and navigate may be used in future enhancements
    
    // Cart store for state updates
    const { setCart } = useCartStore(
        useShallow((state) => ({
            setCart: state.setCart
        }))
    );
    
    // Toast notifications
    const { addToast } = useToast();
    
    // Fetchers for server actions
    const cartFetcher = useFetcher();
    const multipleItemsFetcher = useFetcher();
    const bundleFetcher = useFetcher();
    
    // Handle successful cart updates
    useEffect(() => {
        if (cartFetcher.data?.success && cartFetcher.data.basket) {
            setCart(cartFetcher.data.basket);
            setIsAddingToCart(false);
            addToast(`Added ${product.name} to cart`, 'success');
        } else if (cartFetcher.data?.success === false) {
            console.error('Cart operation failed:', cartFetcher.data.error);
            addToast(`Failed to add to cart: ${cartFetcher.data.error}`, 'error');
            setIsAddingToCart(false);
        }
    }, [cartFetcher.data, setCart, addToast, product.name]);
    
    useEffect(() => {
        if (multipleItemsFetcher.data?.success && multipleItemsFetcher.data.basket) {
            setCart(multipleItemsFetcher.data.basket);
            setIsAddingToCart(false);
            addToast('Added product set to cart', 'success');
        } else if (multipleItemsFetcher.data?.success === false) {
            console.error('Multiple items cart operation failed:', multipleItemsFetcher.data.error);
            addToast(`Failed to add items to cart: ${multipleItemsFetcher.data.error}`, 'error');
            setIsAddingToCart(false);
        }
    }, [multipleItemsFetcher.data, setCart, addToast]);
    
    useEffect(() => {
        if (bundleFetcher.data?.success && bundleFetcher.data.basket) {
            setCart(bundleFetcher.data.basket);
            setIsAddingToCart(false);
            addToast('Added product bundle to cart', 'success');
        } else if (bundleFetcher.data?.success === false) {
            console.error('Bundle cart operation failed:', bundleFetcher.data.error);
            addToast(`Failed to add bundle to cart: ${bundleFetcher.data.error}`, 'error');
            setIsAddingToCart(false);
        }
    }, [bundleFetcher.data, setCart, addToast]);

    // Handle adding to cart
    const handleAddToCart = useCallback(async (
        selectedVariant: any, 
        quantity: number = 1
    ) => {
        if (isAddingToCart) return;
        
        setIsAddingToCart(true);
        
        const productItem = {
            productId: selectedVariant?.productId || product.id,
            quantity,
            price: selectedVariant?.price || product.price
        };

        // Use server action to add item to cart
        cartFetcher.submit(
            { productItem: JSON.stringify(productItem) },
            { 
                method: 'POST',
                action: '/product/add-to-cart'
            }
        );
    }, [product, isAddingToCart, cartFetcher]);

    // Handle adding to wishlist
    const handleAddToWishlist = useCallback(async (selectedVariant?: any) => {
        setIsAddingToWishlist(true);
        try {
            // TODO: Implement actual add to wishlist API call
            
            const productToAdd = {
                productId: selectedVariant?.productId || product.id,
                product: product
            };

            console.log('Adding to wishlist:', productToAdd);
            
            // Placeholder success response
            await new Promise(resolve => setTimeout(resolve, 500));
            
            addToast(`Added ${product.name} to wishlist`, 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
            addToast('Failed to add item to wishlist', 'error');
            throw error;
        } finally {
            setIsAddingToWishlist(false);
        }
    }, [product]);

    // Handle variant selection with URL updates
    const handleVariantSelection = useCallback((variant: any) => {
        if (variant?.productId && variant.productId !== product.id) {
            // Update URL with selected variant
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('pid', variant.productId);
            setSearchParams(newSearchParams);
        }
    }, [product.id, searchParams, setSearchParams]);

    // Handle product set add to cart (multiple products)
    const handleProductSetAddToCart = useCallback(async (
        productSelections: ProductSelectionValues[]
    ) => {
        if (isAddingToCart) return;
        
        setIsAddingToCart(true);
        
        const productItems = productSelections.map(selection => ({
            productId: selection.variant.productId || selection.product.id,
            quantity: selection.quantity,
            price: selection.variant.price || selection.product.price
        }));

        // Use server action to add multiple items to cart
        multipleItemsFetcher.submit(
            { productItems: JSON.stringify(productItems) },
            { 
                method: 'POST',
                action: '/product/add-set-to-cart'
            }
        );
    }, [isAddingToCart, multipleItemsFetcher]);

    // Handle product bundle add to cart
    const handleProductBundleAddToCart = useCallback(async (
        selectedVariant: any,
        quantity: number,
        childProductSelections: any[]
    ) => {
        if (isAddingToCart) return;
        
        setIsAddingToCart(true);
        
        const bundleItem = {
            productId: product.id,
            quantity,
            price: product.price
        };
        
        const childSelections = childProductSelections.map(child => ({
            productId: child.variant.productId || child.product.id,
            quantity: child.quantity
        }));

        // Use server action to add bundle to cart
        bundleFetcher.submit(
            { 
                bundleItem: JSON.stringify(bundleItem),
                childSelections: JSON.stringify(childSelections)
            },
            { 
                method: 'POST',
                action: '/product/add-bundle-to-cart'
            }
        );
    }, [product, isAddingToCart, bundleFetcher]);

    return {
        // State
        isAddingToCart: isAddingToCart || cartFetcher.state === 'submitting' || 
                       multipleItemsFetcher.state === 'submitting' || 
                       bundleFetcher.state === 'submitting',
        isAddingToWishlist,
        
        // Actions
        handleAddToCart,
        handleAddToWishlist,
        handleVariantSelection,
        handleProductSetAddToCart,
        handleProductBundleAddToCart
    };
}
