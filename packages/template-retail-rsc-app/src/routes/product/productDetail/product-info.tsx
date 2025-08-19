/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import type { ShopperProductsTypes } from 'commerce-sdk-isomorphic';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import VariantSelector from './variant-selector';
import QuantitySelector from './quantity-selector';
import { useProductActions } from '../hooks/use-product-actions';
import { useVariantSelection } from '../hooks/use-variant-selection';

interface ProductInfoProps {
    product: ShopperProductsTypes.Product;
    category?: ShopperProductsTypes.Category;
    isProductASet?: boolean;
    isProductABundle?: boolean;
}

export default function ProductInfo({
    product,
    category: _category, // Prefix with underscore to indicate intentionally unused
    isProductASet = false,
    isProductABundle = false
}: ProductInfoProps): ReactElement {
    const [quantity, setQuantity] = useState(1);

    // Use product actions hook
    const {
        isAddingToCart,
        isAddingToWishlist,
        handleAddToCart,
        handleAddToWishlist
    } = useProductActions({
        product,
        isProductASet,
        isProductABundle
    });

    // Use variant selection hook
    const {
        currentVariant,
        selectedAttributes,
        isVariantFullySelected,
        handleAttributeChange,
        getAvailableValues,
        getSelectedValueName
    } = useVariantSelection({
        product
    });

    // Get price data from current variant or base product
    const currentProduct = currentVariant || product;
    const price = currentProduct.price || 0;
    const priceMax = currentProduct.priceMax;

    // Inventory and stock calculations
    // For variant products: stock level comes from main product, but orderability comes from variant
    const inventory = product.inventory; // Always use main product inventory for stock level
    const stockLevel = inventory?.ats || 0;
    const isInStock = stockLevel > 0;
    const isOutOfStock = !isInStock;
    const unfulfillable = isInStock && stockLevel < quantity;
    
    // Check if variant is required but not selected
    const hasVariants = product.variationAttributes && product.variationAttributes.length > 0;
    
    // Comprehensive orderability validation (based on Chakra UI implementation)
    const validateOrderability = (product: ShopperProductsTypes.Product, variant: ShopperProductsTypes.Variant | null | undefined, qty: number, stock: number) => {
        // Must have valid quantity
        if (qty <= 0) return false;
        
        // Cannot exceed stock level
        if (qty > stock) return false;
        
        // For variant products: check if variant is orderable
        // For non-variant products: check if product is orderable
        if (hasVariants) {
            // If variants exist and we have a selected variant, check variant orderability
            if (variant) {
                if (!variant.orderable) return false;
            } else {
                // No variant selected yet for a product with variants
                return false;
            }
        } else {
            // No variants - check main product orderability
            if (!product.inventory?.orderable) return false;
        }
        
        // Must be in stock (unless it's a set/bundle which has different rules)
        if (!isProductASet && !isProductABundle && !isInStock) return false;
        
        return true;
    };
    
    // Can add to cart validation
    const hasValidSelection = validateOrderability(product, currentVariant, quantity, stockLevel);
    const canAddToCart = hasValidSelection;

    const onAddToCart = async () => {
        if (!canAddToCart) {
            console.warn('Cannot add to cart: validation failed', {
                hasValidSelection,
                hasVariants,
                isVariantFullySelected,
                quantity,
                stockLevel
            });
            return;
        }

        // For standard products (no variants), pass the main product
        // For products with variants, pass the selected variant
        const productToAdd = hasVariants ? currentVariant : product;
        
        try {
            await handleAddToCart(productToAdd, quantity);
        } catch (error) {
            console.error('Failed to add product to cart:', error);
            // Error handling is done in the useProductActions hook via toast notifications
        }
    };

    const onAddToWishlist = async () => {
        // For wishlist, also support both standard products and variants
        const productToAdd = hasVariants ? (currentVariant || product) : product;
        
        try {
            await handleAddToWishlist(productToAdd);
        } catch (error) {
            console.error('Failed to add product to wishlist:', error);
            // Error handling is done in the useProductActions hook via toast notifications
        }
    };

    return (
        <div className="space-y-6">
            {/* Desktop Product Title - hidden on mobile */}
            <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                {product.shortDescription && (
                    <p className="mt-2 text-lg text-gray-600">{product.shortDescription}</p>
                )}
            </div>

            {/* Price */}
            <div className="space-y-1">
                {priceMax && priceMax > price ? (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">from</span>
                        <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(price)}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                            {formatCurrency(priceMax)}
                        </span>
                    </div>
                ) : (
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(price)}
                    </div>
                )}
            </div>

            {/* Promotions */}
            {product.promotions && product.promotions.length > 0 && (
                <div className="space-y-2">
                    {product.promotions.map((promotion: any, index: number) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800">
                                {promotion.calloutMsg}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Variant Selection */}
            {product.variationAttributes && product.variationAttributes.length > 0 && (
                <VariantSelector
                    product={product}
                    selectedAttributes={selectedAttributes}
                    onAttributeChange={handleAttributeChange}
                    getAvailableValues={getAvailableValues}
                    getSelectedValueName={getSelectedValueName}
                />
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
                {/* Inventory Messages - Similar to Chakra UI implementation */}
                {(isOutOfStock || unfulfillable) && (
                    <div className="text-orange-600 font-medium">
                        {isOutOfStock 
                            ? `Out of stock for ${product.name}`
                            : `Only ${stockLevel} left for ${product.name}!`
                        }
                    </div>
                )}
                
                {/* Options Selection Message */}
                {hasVariants && !isVariantFullySelected && !isProductASet && !isProductABundle && (
                    <div className="text-orange-600 font-medium">
                        Please select all your options above
                    </div>
                )}

                {/* Quantity Selector - Only for non-set/bundle products */}
                {hasValidSelection && !isProductASet && !isProductABundle && (
                    <QuantitySelector
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        maxQuantity={stockLevel > 0 ? stockLevel : 999}
                    />
                )}

                {/* Debug Info - Shows validation state (remove in production) */}
                <div className="text-xs text-gray-500 border border-gray-300 p-2 rounded bg-gray-50">
                    <div><strong>Validation Debug:</strong></div>
                    <div>hasValidSelection: {hasValidSelection ? 'true' : 'false'}</div>
                    <div>canAddToCart: {canAddToCart ? 'true' : 'false'}</div>
                    <div>isInStock: {isInStock ? 'true' : 'false'}</div>
                    <div>stockLevel: {stockLevel}</div>
                    <div>quantity: {quantity}</div>
                    <div>unfulfillable: {unfulfillable ? 'true' : 'false'}</div>
                    <div>hasVariants: {hasVariants ? 'true' : 'false'}</div>
                    <div>isVariantFullySelected: {isVariantFullySelected ? 'true' : 'false'}</div>
                    <div>currentVariant?.orderable: {currentVariant?.orderable ? 'true' : 'false'}</div>
                    <div>currentVariant?.productId: {currentVariant?.productId || 'none'}</div>
                    <div>product?.inventory?.orderable: {product?.inventory?.orderable ? 'true' : 'false'}</div>
                    <div>product?.id: {product?.id || 'none'}</div>
                    <div>productToAdd: {hasVariants ? (currentVariant?.productId || product?.id) : product?.id}</div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={onAddToCart}
                        disabled={!canAddToCart || isAddingToCart}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-60"
                        size="lg"
                    >
                        {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                    </Button>

                    <Button
                        onClick={onAddToWishlist}
                        disabled={isAddingToWishlist}
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        {isAddingToWishlist ? 'Adding to Wishlist...' : 'Add to Wishlist'}
                    </Button>
                </div>
            </div>

            {/* Product Bundle/Set Notice */}
            {(isProductASet || isProductABundle) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        {isProductASet 
                            ? 'This is a product set. Select individual items below to add to cart.'
                            : 'This is a product bundle. All items will be added together.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
