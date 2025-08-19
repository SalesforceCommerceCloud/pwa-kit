/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use client';

import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';

interface QuantitySelectorProps {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    maxQuantity?: number;
    minQuantity?: number;
}

export default function QuantitySelector({
    quantity,
    onQuantityChange,
    maxQuantity = 99,
    minQuantity = 1
}: QuantitySelectorProps): ReactElement {
    
    const handleDecrease = () => {
        if (quantity > minQuantity) {
            onQuantityChange(quantity - 1);
        }
    };

    const handleIncrease = () => {
        if (quantity < maxQuantity) {
            onQuantityChange(quantity + 1);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value) && value >= minQuantity && value <= maxQuantity) {
            onQuantityChange(value);
        }
    };

    return (
        <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
                Quantity
            </label>
            <div className="flex items-center space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDecrease}
                    disabled={quantity <= minQuantity}
                    className="w-10 h-10 p-0"
                    aria-label="Decrease quantity"
                >
                    -
                </Button>
                
                <input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={handleInputChange}
                    min={minQuantity}
                    max={maxQuantity}
                    className="w-16 h-10 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Quantity"
                />
                
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleIncrease}
                    disabled={quantity >= maxQuantity}
                    className="w-10 h-10 p-0"
                    aria-label="Increase quantity"
                >
                    +
                </Button>
            </div>
            
            {maxQuantity <= 10 && (
                <p className="text-xs text-gray-500">
                    Maximum quantity: {maxQuantity}
                </p>
            )}
        </div>
    );
}
