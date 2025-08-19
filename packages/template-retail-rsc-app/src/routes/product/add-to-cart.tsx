/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import type { ActionFunctionArgs } from 'react-router';
import { addToCart } from './actions';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        throw new Response('Method not allowed', { status: 405 });
    }

    try {
        const formData = await request.formData();
        const productItemJson = formData.get('productItem') as string;
        
        if (!productItemJson) {
            throw new Error('Product item data is required');
        }

        const productItem = JSON.parse(productItemJson);
        const result = await addToCart(request, productItem);
        
        return Response.json(result);
    } catch (error) {
        console.error('Error in add-to-cart action:', error);
        return Response.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to add item to cart'
            },
            { status: 500 }
        );
    }
}
