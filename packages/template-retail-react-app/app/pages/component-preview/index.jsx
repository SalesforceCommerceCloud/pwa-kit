/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useLocation} from 'react-router-dom'
import {useComponent} from '@salesforce/commerce-sdk-react'
import {Page} from '@salesforce/commerce-sdk-react/page-designer'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {PAGEDESIGNER_TO_COMPONENT} from '@salesforce/retail-react-app/app/page-designer/component-map'
import {injectIntoPreviewRegion} from '@salesforce/retail-react-app/app/page-designer/preview-page'

/**
 * Mini-PD component-preview route.
 *
 * Renders a single existing Page Designer component standalone (chrome-free) for
 * the mini-PD "Edit in focused visual canvas" iframe. It is an internal authoring
 * surface, not a public storefront page:
 *  - It renders only when the request is in Page Designer EDIT or PREVIEW mode
 *    (`?mode=EDIT|PREVIEW`); otherwise it renders nothing.
 *  - It emits `robots: noindex`.
 *
 * It fetches the component by `componentId` (from the URL), wraps it in a synthetic
 * single-region page, and renders it via the existing <Page> pipeline — no changes
 * to the render pipeline are required.
 */
const ComponentPreview = () => {
    const {search} = useLocation()
    const searchParams = new URLSearchParams(search)
    const componentId = searchParams.get('componentId')
    // Read mode straight from the URL search — SSR-safe (no window dependency).
    // The runtime's isDesignModeActive()/isPreviewModeActive() no-arg forms fall
    // back to window.location and are unsafe during SSR, so we don't use them.
    const mode = searchParams.get('mode')
    const inDesignOrPreview = mode === 'EDIT' || mode === 'PREVIEW'

    const {
        data: component,
        isLoading,
        error
    } = useComponent(
        {parameters: {componentId}},
        {enabled: Boolean(inDesignOrPreview && componentId)}
    )

    if (!inDesignOrPreview || !componentId) {
        return null
    }

    return (
        <Box data-testid="component-preview-page" layerStyle="page">
            <Seo title="Component Preview" noIndex />
            {isLoading && (
                <Box textAlign="center" py={8}>
                    Loading...
                </Box>
            )}
            {error && (
                <Box textAlign="center" py={8} color="red.500">
                    Error loading component.
                </Box>
            )}
            {component && !error && (
                <Page
                    page={injectIntoPreviewRegion(component)}
                    components={PAGEDESIGNER_TO_COMPONENT}
                />
            )}
        </Box>
    )
}

ComponentPreview.getTemplateName = () => 'component-preview'

export default ComponentPreview
