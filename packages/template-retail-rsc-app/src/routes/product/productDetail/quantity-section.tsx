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
import QuantitySelector from './quantity-selector';

interface QuantitySectionProps {
    product: ShopperProductsTypes.Product;
    isProductASet?: boolean;
    isProductABundle?: boolean;
}

export default function QuantitySection({
    product,
    isProductASet = false,
    isProductABundle = false
}: QuantitySectionProps): ReactElement | null {
    const [quantity, setQuantity] = useState(1);
    
    // Don't show for sets/bundles as they have their own quantity logic
    if (isProductASet || isProductABundle) {
        return null;
    }
    
    // Inventory calculations
    const inventory = product.inventory;
    const stockLevel = inventory?.ats || inventory?.stockLevel || 0;
    const maxQuantity = stockLevel > 0 ? Math.min(stockLevel, 99) : 99;
    const isInStock = stockLevel > 0;
    
    return (
        <div className="border-t border-gray-200 pt-8">
            <div className="max-w-md">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Quantity</h3>
                    
                    {!isInStock && (
                        <div className="text-sm text-red-600 font-medium">
                            This item is currently out of stock
                        </div>
                    )}
                    
                    <QuantitySelector
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        maxQuantity={maxQuantity}
                        minQuantity={1}
                    />
                    
                    <div className="text-sm text-gray-500">
                        <p>Stock available: {stockLevel}</p>
                        {stockLevel <= 10 && stockLevel > 0 && (
                            <p className="text-orange-600 font-medium">
                                Only {stockLevel} left in stock!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
