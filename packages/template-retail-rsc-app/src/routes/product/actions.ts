/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import 'server-only';
import { redirect } from 'react-router';
import type { ShopperBasketsTypes } from 'commerce-sdk-isomorphic';
import { getCommerceApiToken } from '@/utils/api/commerce-api';
import { createShopperBasketsClient } from '@/utils/api/commerce-client';

interface ProductItem {
    productId: string;
    quantity: number;
    price?: number;
    bundledProductItems?: Array<{
        productId: string;
        quantity: number;
    }>;
}

interface AddToCartResult {
    success: boolean;
    basket?: ShopperBasketsTypes.Basket;
    error?: string;
}

/**
 * Server action to add a single item to cart
 */
export async function addToCart(
    request: Request,
    productItem: ProductItem
): Promise<AddToCartResult> {
    try {
        const [session, commitSession] = await getCommerceApiToken(request);
        const client = createShopperBasketsClient(session.data);
        let basketId = session.data.basketId;

        // Create basket if it doesn't exist
        if (!basketId) {
            const newBasket = await client.createBasket({
                body: {}
            });
            basketId = newBasket.basketId!;
            
            // Update session with new basket ID
            await commitSession({
                ...session,
                data: {
                    ...session.data,
                    basketId
                }
            });
        }

        // Add item to basket
        const updatedBasket = await client.addItemToBasket({
            parameters: { basketId },
            body: [{
                productId: productItem.productId,
                quantity: productItem.quantity,
                ...(productItem.bundledProductItems && {
                    bundledProductItems: productItem.bundledProductItems
                })
            }]
        });

        return {
            success: true,
            basket: updatedBasket
        };
    } catch (error) {
        console.error('Error adding item to cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add item to cart'
        };
    }
}

/**
 * Server action to add multiple items to cart (for product sets)
 */
export async function addMultipleItemsToCart(
    request: Request,
    productItems: ProductItem[]
): Promise<AddToCartResult> {
    try {
        const [session, commitSession] = await getCommerceApiToken(request);
        const client = createShopperBasketsClient(session.data);
        let basketId = session.data.basketId;

        // Create basket if it doesn't exist
        if (!basketId) {
            const newBasket = await client.createBasket({
                body: {}
            });
            basketId = newBasket.basketId!;
            
            // Update session with new basket ID
            await commitSession({
                ...session,
                data: {
                    ...session.data,
                    basketId
                }
            });
        }

        // Add all items to basket in a single API call
        const updatedBasket = await client.addItemToBasket({
            parameters: { basketId },
            body: productItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        });

        return {
            success: true,
            basket: updatedBasket
        };
    } catch (error) {
        console.error('Error adding multiple items to cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add items to cart'
        };
    }
}

/**
 * Server action to add product bundle to cart
 */
export async function addBundleToCart(
    request: Request,
    bundleItem: ProductItem,
    childSelections: Array<{ productId: string; quantity: number }>
): Promise<AddToCartResult> {
    try {
        const [session, commitSession] = await getCommerceApiToken(request);
        const client = createShopperBasketsClient(session.data);
        let basketId = session.data.basketId;

        // Create basket if it doesn't exist
        if (!basketId) {
            const newBasket = await client.createBasket({
                body: {}
            });
            basketId = newBasket.basketId!;
            
            // Update session with new basket ID
            await commitSession({
                ...session,
                data: {
                    ...session.data,
                    basketId
                }
            });
        }

        // Add bundle to basket with bundled product items
        const updatedBasket = await client.addItemToBasket({
            parameters: { basketId },
            body: [{
                productId: bundleItem.productId,
                quantity: bundleItem.quantity,
                bundledProductItems: childSelections
            }]
        });

        // If there are child selections, we may need to update them
        // This is a follow-up call similar to the original implementation
        if (childSelections.length > 0) {
            // Get the basket item we just added
            const addedItem = updatedBasket.productItems?.find(
                item => item.productId === bundleItem.productId
            );

            if (addedItem?.bundledProductItems) {
                // Update the bundled product items with correct variant selections
                const itemsToUpdate = addedItem.bundledProductItems.map((bundledItem, index) => ({
                    itemId: bundledItem.itemId,
                    productId: childSelections[index]?.productId || bundledItem.productId,
                    quantity: childSelections[index]?.quantity || bundledItem.quantity
                }));

                // Update items in basket
                await client.updateItemsInBasket({
                    parameters: { basketId },
                    body: itemsToUpdate
                });
                
                // Get the final updated basket
                const finalBasket = await client.getBasket({
                    parameters: { basketId }
                });

                return {
                    success: true,
                    basket: finalBasket
                };
            }
        }

        return {
            success: true,
            basket: updatedBasket
        };
    } catch (error) {
        console.error('Error adding bundle to cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add bundle to cart'
        };
    }
}

/**
 * Server action to get current basket
 */
export async function getCurrentBasket(request: Request): Promise<ShopperBasketsTypes.Basket | null> {
    try {
        const [session] = await getCommerceApiToken(request);
        const basketId = session.data.basketId;
        
        if (!basketId) {
            return null;
        }

        const client = createShopperBasketsClient(session.data);
        const basket = await client.getBasket({
            parameters: { basketId }
        });

        return basket;
    } catch (error) {
        console.error('Error getting current basket:', error);
        return null;
    }
}
