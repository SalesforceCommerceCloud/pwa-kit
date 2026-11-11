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
 * Computes the maximum downward extent of a single element's box-shadow.
 * `getBoundingClientRect` does not include shadows, so this offset is added
 * to the measured height so the panel clears the shadow visually.
 */
const shadowExtent = (el) => {
    const raw = getComputedStyle(el).boxShadow
    if (!raw || raw === 'none') return 0

    let max = 0
    for (const layer of raw.split(/,(?![^(]*\))/)) {
        // Strip color functions and the inset keyword, leaving only numeric values.
        const stripped = layer.replace(/\b(inset|rgba?|hsla?)\([^)]*\)/gi, '').trim()
        const nums = stripped.match(/-?\d+(\.\d+)?(px)?/g)
        if (!nums || nums.length < 2) continue
        const yOffset = parseFloat(nums[1])
        const blur = nums.length >= 3 ? parseFloat(nums[2]) : 0
        const spread = nums.length >= 4 ? parseFloat(nums[3]) : 0
        max = Math.max(max, yOffset + blur + spread)
    }
    return max
}

/**
 * Returns the largest downward shadow extent from the element or any
 * descendant, since the header wrapper itself may not carry the
 * box-shadow (the inner Header component does in the default theme).
 */
const getShadowOffset = (el) => {
    let max = shadowExtent(el)
    for (const desc of el.querySelectorAll('*')) {
        const s = shadowExtent(desc)
        if (s > max) max = s
    }
    return Math.ceil(max)
}

/**
 * Sets `--cc-panel-top` on the document root so the Commerce Client widget
 * panel positions itself below the sticky header. The value accounts for both
 * the header's measured height and its box-shadow extent.
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
            const h = header.getBoundingClientRect().height
            if (h > 0) {
                root.style.setProperty('--cc-panel-top', `${h + shadowOffset}px`)
            }
        }

        // Compute once — theme shadows don't change at runtime.
        // Deferred to rAF so descendants (inside Island) have rendered.
        let shadowOffset = 0
        update()
        requestAnimationFrame(() => {
            shadowOffset = getShadowOffset(header)
            update()
        })

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
