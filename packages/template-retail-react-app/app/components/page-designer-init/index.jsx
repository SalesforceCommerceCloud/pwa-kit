/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {Prompt} from 'react-router-dom'
import {
    usePageDesignerMode,
    useGlobalAnchorBlock
} from '@salesforce/commerce-sdk-react/page-designer'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'

/**
 * PageDesignerInit - Component that handles Page Designer initialization
 *
 * This component is responsible for:
 * 1. Blocking navigation in React Router when in Page Designer design mode
 * 2. Preventing anchor clicks from navigating (using useGlobalAnchorBlock)
 * 3. Dynamically importing Page Designer styles when in design mode
 *
 * The component prevents accidental navigation during content editing in Page Designer,
 * ensuring that content managers can click on links within the preview without leaving
 * the editing interface.
 *
 * Required URL Parameters (automatically detected):
 * - mode=EDIT - Activates design mode for editing content in Page Designer
 * - mode=PREVIEW - Activates preview mode for previewing content
 * - pdToken - Authentication token for Page Designer API requests (optional)
 * - pageId - Specific page ID to load in Page Designer (optional)
 *
 * @example
 * ```jsx
 * // In your App component
 * import PageDesignerInit from './components/page-designer-init'
 *
 * function App() {
 *     return (
 *         <PageDesignerProvider clientId="pwa-kit" targetOrigin="*" usid={usid}>
 *             <PageDesignerInit />
 *             <YourAppContent />
 *         </PageDesignerProvider>
 *     )
 * }
 * ```
 *
 * @example
 * ```
 * // Example URLs:
 * https://example.com/?mode=EDIT&pdToken=abc123&pageId=homepage
 * https://example.com/?mode=PREVIEW&pdToken=xyz789
 * ```
 */
export function PageDesignerInit() {
    const {isDesignMode} = usePageDesignerMode()

    // Block anchor navigation when in design mode
    // Pass isDesignMode to control when navigation blocking is active
    useGlobalAnchorBlock(isDesignMode)

    // Dynamically load the Page Designer global styles only when in design mode.
    // This ensures the styles are not loaded in production runtime, improving performance.
    useEffect(() => {
        if (!isDesignMode) {
            return
        }

        const id = 'pd-design-styles'
        if (document.getElementById(id)) {
            return
        }

        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = getAssetUrl('static/pd-design-styles.css')
        document.head.appendChild(link)

        return () => link.remove()
    }, [isDesignMode])

    // When the message function returns false, navigation is completely blocked (no dialog shown)
    return (
        <React.Fragment>
            <Prompt when={isDesignMode} message={() => false} />
        </React.Fragment>
    )
}

export default PageDesignerInit
