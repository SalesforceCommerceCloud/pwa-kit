/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

/**
 * React hook that prevents all <a> (anchor) navigation by default in the document,
 * unless the anchor has the attribute `data-pd-allow-link`.
 *
 * This is used in Page Designer design mode to prevent accidental navigation
 * when clicking on links within the preview iframe.
 *
 * To allow a specific link to navigate even in design mode, add the attribute:
 * <a href="/path" data-pd-allow-link>Navigable Link</a>
 *
 * @param {boolean} enabled - Whether to block navigation. Defaults to true.
 *
 * @example
 * ```jsx
 * function PageDesignerInit() {
 *     const { isDesignMode } = usePageDesignerMode();
 *     useGlobalAnchorBlock(isDesignMode);
 *     return null;
 * }
 * ```
 */
export function useGlobalAnchorBlock(enabled = true) {
    useEffect(() => {
        // Only run on client-side
        if (typeof window === 'undefined' || !enabled) {
            return
        }

        function preventAnchorClicks(event: MouseEvent) {
            const target = event.target as HTMLElement
            const anchor = target.closest('a')

            if (!anchor) {
                return
            }

            // Allow links with data-pd-allow-link attribute
            if (anchor.hasAttribute('data-pd-allow-link')) {
                return
            }

            const href = anchor.getAttribute('href')

            // Allow hash/anchor links (e.g., #section) as they don't navigate away
            if (href && href.startsWith('#')) {
                return
            }

            // Block all other navigation in design mode
            event.preventDefault()
        }

        // Use capture phase to intercept clicks before React Router's handlers
        document.addEventListener('click', preventAnchorClicks, true)

        return () => document.removeEventListener('click', preventAnchorClicks, true)
    }, [enabled])
}
