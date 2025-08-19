/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use client';

import React, { type ReactElement } from 'react';
import type { ShopperProductsTypes } from 'commerce-sdk-isomorphic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { useProductSetsBundles } from '../hooks/use-product-sets-bundles';
import { useProductActions } from '../hooks/use-product-actions';
import ProductImageGallery from './product-image-gallery';
import VariantSelector from './variant-selector';
import QuantitySelector from './quantity-selector';
import { useVariantSelection } from '../hooks/use-variant-selection';

interface ProductSetBundleProps {
    product: ShopperProductsTypes.Product;
    isProductASet?: boolean;
    isProductABundle?: boolean;
}

export default function ProductSetBundle({
    product,
    isProductASet = false,
    isProductABundle = false
}: ProductSetBundleProps): ReactElement {
    const {
        comboProduct,
        childProductSelection,
        selectedBundleQuantity,
        areAllChildProductsSelected,
        hasUnorderableChildProducts,
        handleChildProductValidation,
        setChildProductSelection,
        setSelectedBundleQuantity,
        selectedChildProductCount,
        totalChildProducts
    } = useProductSetsBundles({
        product,
        isProductASet,
        isProductABundle
    });

    const {
        isAddingToCart,
        handleProductSetAddToCart,
        handleProductBundleAddToCart
    } = useProductActions({
        product,
        isProductASet,
        isProductABundle
    });

    const childProducts = comboProduct.childProducts || [];

    const handleAddToCart = async () => {
        // Validate all child products are selected
        if (!handleChildProductValidation()) {
            return;
        }

        if (isProductASet) {
            const selectedProducts = Object.values(childProductSelection);
            await handleProductSetAddToCart(selectedProducts);
        } else if (isProductABundle) {
            const selectedProducts = Object.values(childProductSelection);
            await handleProductBundleAddToCart(
                product, 
                selectedBundleQuantity, 
                selectedProducts
            );
        }
    };

    const canAddToCart = areAllChildProductsSelected && !hasUnorderableChildProducts;

    if (!isProductASet && !isProductABundle) {
        return <></>;
    }

    return (
        <div className="space-y-8">
            {/* Set/Bundle Header */}
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {isProductASet ? 'Product Set' : 'Product Bundle'}
                </h2>
                <p className="text-gray-600">
                    {isProductASet 
                        ? 'Choose from the items below to create your perfect set'
                        : 'All items in this bundle will be added to your cart together'
                    }
                </p>
                
                {/* Progress indicator */}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <span>{selectedChildProductCount} of {totalChildProducts} selected</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(selectedChildProductCount / totalChildProducts) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Child Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {childProducts.map((childProduct: any, index: number) => (
                    <ChildProductCard
                        key={childProduct.product.id}
                        childProduct={childProduct}
                        index={index}
                        isProductASet={isProductASet}
                        isProductABundle={isProductABundle}
                        onSelectionChange={(selection) => 
                            setChildProductSelection(childProduct.product.id, selection)
                        }
                    />
                ))}
            </div>

            {/* Bundle Quantity Selector (for bundles only) */}
            {isProductABundle && (
                <div className="flex justify-center">
                    <div className="w-64">
                        <QuantitySelector
                            quantity={selectedBundleQuantity}
                            onQuantityChange={setSelectedBundleQuantity}
                            maxQuantity={10}
                        />
                    </div>
                </div>
            )}

            {/* Add to Cart Button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart || isAddingToCart}
                    size="lg"
                    className="min-w-64"
                >
                    {isAddingToCart ? 'Adding...' : 
                     isProductASet ? 'Add Set to Cart' : 'Add Bundle to Cart'}
                </Button>
            </div>

            {/* Error Messages */}
            {!areAllChildProductsSelected && (
                <div className="text-center text-red-600">
                    Please select all your options above
                </div>
            )}
        </div>
    );
}

// Child Product Card Component
interface ChildProductCardProps {
    childProduct: any;
    index: number;
    isProductASet: boolean;
    isProductABundle: boolean;
    onSelectionChange: (selection: any) => void;
}

function ChildProductCard({
    childProduct,
    index,
    isProductASet,
    isProductABundle,
    onSelectionChange
}: ChildProductCardProps): ReactElement {
    const product = childProduct.product;
    
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

    const [quantity, setQuantity] = React.useState(childProduct.quantity || 1);

    // Update parent when selection changes
    React.useEffect(() => {
        if (isVariantFullySelected && currentVariant) {
            onSelectionChange({
                product,
                variant: currentVariant,
                quantity
            });
        }
    }, [currentVariant, quantity, isVariantFullySelected, product, onSelectionChange]);

    const price = currentVariant?.price || product.price || 0;
    const isInStock = (currentVariant?.inventory?.ats || product.inventory?.ats || 0) > 0;

    return (
        <Card className="h-full" data-testid="child-product">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(price)}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Product Image */}
                <div className="aspect-square">
                    <ProductImageGallery
                        product={product}
                        isProductASet={isProductASet}
                        isProductABundle={isProductABundle}
                    />
                </div>

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

                {/* Quantity for Product Sets */}
                {isProductASet && (
                    <QuantitySelector
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        maxQuantity={10}
                    />
                )}

                {/* Stock Status */}
                {!isInStock && (
                    <div className="text-red-600 font-medium text-center">
                        Out of stock
                    </div>
                )}

                {/* Selection Status */}
                <div className="text-center text-sm">
                    {isVariantFullySelected ? (
                        <span className="text-green-600 font-medium">✓ Selected</span>
                    ) : (
                        <span className="text-gray-500">Select options above</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
