/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

const onClient = typeof window !== 'undefined'

export const CC_HEADER_ID = 'cc-header-wrapper'

const parseShadowExtent = (shadow) => {
    if (!shadow || shadow === 'none') return 0
    let max = 0
    for (const layer of shadow.split(/,(?![^(]*\))/)) {
        const nums = layer.match(/(-?\d+(?:\.\d+)?)px/g)
        if (nums && nums.length >= 3) {
            const offsetY = parseFloat(nums[1])
            const blur = parseFloat(nums[2])
            const spread = nums[3] ? parseFloat(nums[3]) : 0
            max = Math.max(max, offsetY + blur + spread)
        }
    }
    return max
}

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
                // Account for box-shadow extending below the header's content box.
                const shadow = getComputedStyle(
                    header.lastElementChild || header
                ).boxShadow
                const shadowExtent = parseShadowExtent(shadow)
                root.style.setProperty('--cc-panel-top', `${bottom + shadowExtent}px`)
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
