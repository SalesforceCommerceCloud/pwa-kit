/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    PREVIEW_REGION_ID,
    PREVIEW_PAGE_ID,
    injectIntoPreviewRegion
} from '@salesforce/retail-react-app/app/page-designer/preview-page'

describe('injectIntoPreviewRegion', () => {
    test('wraps a component in a synthetic single-region page', () => {
        const component = {id: 'comp1', typeId: 'commerce_assets.imageTile', data: {}}
        const page = injectIntoPreviewRegion(component)
        expect(page).toEqual({
            id: PREVIEW_PAGE_ID,
            regions: [{id: PREVIEW_REGION_ID, components: [component]}]
        })
    })

    test('PREVIEW_REGION_ID is "preview"', () => {
        expect(PREVIEW_REGION_ID).toBe('preview')
    })
})
