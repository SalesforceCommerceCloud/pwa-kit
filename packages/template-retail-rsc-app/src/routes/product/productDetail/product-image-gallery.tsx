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

interface ProductImageGalleryProps {
    product: ShopperProductsTypes.Product;
    isProductASet?: boolean;
    isProductABundle?: boolean;
}

export default function ProductImageGallery({
    product,
    isProductASet = false,
    isProductABundle = false
}: ProductImageGalleryProps): ReactElement {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    
    // Get the image groups, prioritizing the master product images
    const imageGroups = product.imageGroups || [];
    const primaryImageGroup = imageGroups.find(group => group.viewType === 'large') || imageGroups[0];
    const images = primaryImageGroup?.images || [];
    
    // If no images available, show placeholder
    if (images.length === 0) {
        return (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📷</div>
                    <p>No image available</p>
                </div>
            </div>
        );
    }

    const selectedImage = images[selectedImageIndex];

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img
                    src={`${selectedImage.disBaseLink || selectedImage.link}?sw=600&q=85`}
                    alt={selectedImage.alt || product.name}
                    className="w-full h-full object-cover object-center"
                    loading={isProductASet || isProductABundle ? 'lazy' : 'eager'}
                />
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`
                                aspect-square overflow-hidden rounded-lg bg-gray-100
                                border-2 transition-colors
                                ${selectedImageIndex === index 
                                    ? 'border-blue-600' 
                                    : 'border-transparent hover:border-gray-300'
                                }
                            `}
                        >
                            <img
                                src={`${image.disBaseLink || image.link}?sw=150&q=75`}
                                alt={image.alt || `${product.name} view ${index + 1}`}
                                className="w-full h-full object-cover object-center"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
