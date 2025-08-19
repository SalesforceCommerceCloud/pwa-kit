/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import type { ReactElement } from 'react';
import type { ShopperProductsTypes } from 'commerce-sdk-isomorphic';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

interface ProductAccordionProps {
    product: ShopperProductsTypes.Product;
}

export default function ProductAccordion({
    product
}: ProductAccordionProps): ReactElement {
    
    return (
        <div className="max-w-4xl">
            <Accordion type="multiple" className="w-full">
                {/* Product Details */}
                <AccordionItem value="details">
                    <AccordionTrigger className="text-left font-semibold text-lg">
                        Product Details
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                            {product.longDescription ? (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: product.longDescription
                                    }}
                                    className="prose prose-sm max-w-none"
                                />
                            ) : (
                                <p>{product.shortDescription || 'No detailed description available.'}</p>
                            )}
                            
                            {/* Additional product attributes */}
                            {product.brand && (
                                <div>
                                    <strong>Brand:</strong> {product.brand}
                                </div>
                            )}
                            
                            {product.manufacturerName && (
                                <div>
                                    <strong>Manufacturer:</strong> {product.manufacturerName}
                                </div>
                            )}
                            
                            {product.manufacturerSku && (
                                <div>
                                    <strong>SKU:</strong> {product.manufacturerSku}
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Size & Fit */}
                <AccordionItem value="size-fit">
                    <AccordionTrigger className="text-left font-semibold text-lg">
                        Size & Fit
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="text-gray-700">
                            <p>Size and fit information coming soon.</p>
                            {/* Future: Add size chart, fit guide, etc. */}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Shipping & Returns */}
                <AccordionItem value="shipping">
                    <AccordionTrigger className="text-left font-semibold text-lg">
                        Shipping & Returns
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="text-gray-700 space-y-2">
                            <p><strong>Free shipping</strong> on orders over $50</p>
                            <p><strong>Standard shipping:</strong> 3-5 business days</p>
                            <p><strong>Express shipping:</strong> 1-2 business days</p>
                            <p><strong>Returns:</strong> 30-day return policy</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Reviews */}
                <AccordionItem value="reviews">
                    <AccordionTrigger className="text-left font-semibold text-lg">
                        Reviews
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="text-gray-700">
                            <p>Customer reviews coming soon.</p>
                            {/* Future: Add review system integration */}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Care Instructions */}
                {product.type?.item && (
                    <AccordionItem value="care">
                        <AccordionTrigger className="text-left font-semibold text-lg">
                            Care Instructions
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="text-gray-700">
                                <p>Care instructions coming soon.</p>
                                {/* Future: Add care instruction details */}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    );
}
