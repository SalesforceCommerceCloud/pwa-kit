/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import type { ActionFunctionArgs } from 'react-router';
import { addMultipleItemsToCart } from './actions';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        throw new Response('Method not allowed', { status: 405 });
    }

    try {
        const formData = await request.formData();
        const productItemsJson = formData.get('productItems') as string;
        
        if (!productItemsJson) {
            throw new Error('Product items data is required');
        }

        const productItems = JSON.parse(productItemsJson);
        const result = await addMultipleItemsToCart(request, productItems);
        
        return Response.json(result);
    } catch (error) {
        console.error('Error in add-set-to-cart action:', error);
        return Response.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to add items to cart'
            },
            { status: 500 }
        );
    }
}
