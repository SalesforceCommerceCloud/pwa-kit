/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import type { ActionFunctionArgs } from 'react-router';
import { addBundleToCart } from './actions';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        throw new Response('Method not allowed', { status: 405 });
    }

    try {
        const formData = await request.formData();
        const bundleItemJson = formData.get('bundleItem') as string;
        const childSelectionsJson = formData.get('childSelections') as string;
        
        if (!bundleItemJson || !childSelectionsJson) {
            throw new Error('Bundle item and child selections data are required');
        }

        const bundleItem = JSON.parse(bundleItemJson);
        const childSelections = JSON.parse(childSelectionsJson);
        
        const result = await addBundleToCart(request, bundleItem, childSelections);
        
        return Response.json(result);
    } catch (error) {
        console.error('Error in add-bundle-to-cart action:', error);
        return Response.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to add bundle to cart'
            },
            { status: 500 }
        );
    }
}
