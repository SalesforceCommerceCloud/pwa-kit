/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * The id of the synthetic region that hosts the single previewed component.
 * Must stay stable; the mini-PD canvas targets this region.
 */
export const PREVIEW_REGION_ID = 'preview'

/** The id of the synthetic page wrapping the previewed component. */
export const PREVIEW_PAGE_ID = '__pwakit_preview__'

/**
 * Wrap a single fetched Page Designer component in a synthetic one-region page
 * so the existing page-mode <Page>/<Region> pipeline can render it standalone,
 * with no changes to the render pipeline.
 *
 * @param {object} component - A Shopper Experience Component (from useComponent).
 * @returns {object} A minimal Page-shaped object hosting the component.
 */
export const injectIntoPreviewRegion = (component) => ({
    id: PREVIEW_PAGE_ID,
    regions: [{id: PREVIEW_REGION_ID, components: [component]}]
})
