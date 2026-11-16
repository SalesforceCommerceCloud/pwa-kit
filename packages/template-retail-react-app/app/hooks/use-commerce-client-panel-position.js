/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

const onClient = typeof window !== 'undefined'

export const CC_HEADER_ID = 'cc-header-wrapper'

/**
 * Sets `--cc-panel-top` on the document root so the Commerce Client widget
 * panel positions itself below the sticky header.
 *
 * Uses `document.getElementById` instead of a React ref to avoid hydration
 * timing issues with `<Island>` partial hydration boundaries. Observes both
 * size changes (ResizeObserver) and DOM mutations (MutationObserver) to catch
 * content that renders after Island hydration.
 *
 * @param {boolean} isActive - Whether page-push layout is active
 */
export const useCommerceClientPanelPosition = (isActive) => {
    useEffect(() => {
        if (!onClient || !isActive) return undefined

        const header = document.getElementById(CC_HEADER_ID)
        if (!header) return undefined

        const root = document.documentElement

        const update = () => {
            const bottom = header.getBoundingClientRect().bottom
            if (bottom > 0) {
                root.style.setProperty('--cc-panel-top', `${bottom}px`)
            }
        }

        update()

        const cleanups = []

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(update)
            ro.observe(header)
            cleanups.push(() => ro.disconnect())
        }

        if (typeof MutationObserver !== 'undefined') {
            const mo = new MutationObserver(update)
            mo.observe(header, {childList: true, subtree: true, attributes: true})
            cleanups.push(() => mo.disconnect())
        }

        return () => {
            cleanups.forEach((fn) => fn())
            root.style.removeProperty('--cc-panel-top')
        }
    }, [isActive])
}

export default useCommerceClientPanelPosition
