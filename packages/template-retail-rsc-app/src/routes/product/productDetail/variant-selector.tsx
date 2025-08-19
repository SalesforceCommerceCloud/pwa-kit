/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use client';

import type { ReactElement } from 'react';
import React from 'react';
import type { ShopperProductsTypes } from 'commerce-sdk-isomorphic';
import { Button } from '@/components/ui/button';

interface VariantSelectorProps {
    product: ShopperProductsTypes.Product;
    selectedAttributes: Record<string, string>;
    onAttributeChange: (attributeId: string, value: string) => void;
    getAvailableValues: (attributeId: string) => any[];
    getSelectedValueName: (attributeId: string) => string | undefined;
}

export default function VariantSelector({
    product,
    selectedAttributes,
    onAttributeChange,
    getAvailableValues,
    getSelectedValueName
}: VariantSelectorProps): ReactElement {
    const variationAttributes = product.variationAttributes || [];

    const renderColorSwatch = (attribute: any, color: any) => {
        const isSelected = selectedAttributes[attribute.id] === color.value;
        const colorValue = color.value.toLowerCase();
        
        return (
            <button
                key={color.value}
                onClick={() => onAttributeChange(attribute.id, color.value)}
                className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${isSelected 
                        ? 'border-gray-900 shadow-lg scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }
                `}
                style={{ backgroundColor: getColorValue(colorValue) }}
                title={color.name}
                aria-label={`Select color ${color.name}`}
            >
                {/* Inner ring for selected state */}
                {isSelected && (
                    <div className="w-full h-full rounded-full border-2 border-white" />
                )}
            </button>
        );
    };

    const renderSizeSwatch = (attribute: any, size: any) => {
        const isSelected = selectedAttributes[attribute.id] === size.value;
        const isOrderable = size.orderable !== false;
        
        return (
            <Button
                key={size.value}
                onClick={() => isOrderable && onAttributeChange(attribute.id, size.value)}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                disabled={!isOrderable}
                className={`
                    min-w-[3rem] h-10
                    ${!isOrderable ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {size.name}
            </Button>
        );
    };

    const renderDefaultSwatch = (attribute: any, value: any) => {
        const isSelected = selectedAttributes[attribute.id] === value.value;
        const isOrderable = value.orderable !== false;
        
        return (
            <Button
                key={value.value}
                onClick={() => isOrderable && onAttributeChange(attribute.id, value.value)}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                disabled={!isOrderable}
                className={!isOrderable ? 'opacity-50 cursor-not-allowed' : ''}
            >
                {value.name}
            </Button>
        );
    };

    if (variationAttributes.length === 0) {
        return <></>;
    }

    return (
        <div className="space-y-6">
            {variationAttributes.map(attribute => {
                const selectedValueName = getSelectedValueName(attribute.id);
                const availableValues = getAvailableValues(attribute.id);
                
                return (
                    <div key={attribute.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                                {attribute.name}
                            </h3>
                            {selectedValueName && (
                                <span className="text-sm text-gray-600">
                                    {selectedValueName}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {availableValues.map(value => {
                                // Determine which type of swatch to render
                                if (attribute.id.toLowerCase().includes('color')) {
                                    return renderColorSwatch(attribute, value);
                                } else if (attribute.id.toLowerCase().includes('size')) {
                                    return renderSizeSwatch(attribute, value);
                                } else {
                                    return renderDefaultSwatch(attribute, value);
                                }
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper function to get color value for swatches
function getColorValue(colorName: string): string {
    const colorMap: Record<string, string> = {
        'black': '#000000',
        'white': '#ffffff',
        'red': '#dc2626',
        'blue': '#2563eb',
        'green': '#16a34a',
        'yellow': '#eab308',
        'pink': '#ec4899',
        'purple': '#9333ea',
        'gray': '#6b7280',
        'grey': '#6b7280',
        'brown': '#a3713e',
        'navy': '#1e3a8a',
        'beige': '#f5f5dc',
        'tan': '#d2b48c',
        'orange': '#ea580c'
    };
    
    return colorMap[colorName] || '#6b7280';
}
