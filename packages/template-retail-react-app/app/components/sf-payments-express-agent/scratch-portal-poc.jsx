/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Scratch portal PoC for the shopper-agent PDP-like slot mechanism.
//
// Cimulate exposes two product surfaces: a multi-card collection (.cim-widget-msg-product-card,
// PLP-like) and a single-item PDP-like drill-down (.cim-widget-msg-pdp). Per parity with the
// non-agent flow (express buttons live on PDP, not PLP), we target the PDP surface only.
//
// Selectors captured 2026-08-08 from a live widget on zyoe-010:
//   .cim-widget-msg-pdp          — the outer wrapper for the drill-down view
//   .cim-widget-msg-pdp__content — where title + quantity render; we portal here so the
//                                  button sits under the stepper, matching non-agent PDP layout
//
// Product id: NOT exposed in the PDP DOM. PoC hack — scrape the leading digits from the
// primary image filename (e.g. images/medium/503700.jpg → 503700). This is a throwaway
// heuristic that only works on sites whose image filenames start with the productId.
// Real answer for Slice A is a Cimulate-side override that injects `data-product-id`,
// or an upstream ask to emit one. See scratch/design/…-design.md §11 open questions.

import React, {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

const PDP_WRAPPER_SELECTOR = '.cim-widget-msg-pdp'
const PDP_CONTENT_SELECTOR = '.cim-widget-msg-pdp__content'
const PDP_IMAGE_SELECTOR = '.cim-widget-pdp-gallery__image'

// Extract leading digits from an image URL filename: `.../medium/503700.jpg` → `503700`.
// PoC heuristic — see the header comment.
const scrapeProductIdFromImage = (pdpNode) => {
    const src = pdpNode.querySelector(PDP_IMAGE_SELECTOR)?.getAttribute('src') ?? ''
    const filename = src.split('/').pop() ?? ''
    const match = filename.match(/^(\d+)/)
    return match?.[1] ?? null
}

export const ScratchPortalPoC = () => {
    const [pdps, setPdps] = useState([])

    useEffect(() => {
        const scan = () => {
            setPdps(Array.from(document.querySelectorAll(PDP_WRAPPER_SELECTOR)))
        }

        const observer = new MutationObserver(scan)
        observer.observe(document.body, {childList: true, subtree: true})
        scan()

        return () => observer.disconnect()
    }, [])

    return (
        <>
            {pdps.map((node, i) => {
                const anchor = node.querySelector(PDP_CONTENT_SELECTOR) ?? node
                const title =
                    node.querySelector('.cim-widget-msg-pdp__title')?.textContent?.trim() ??
                    'unknown'
                const productId = scrapeProductIdFromImage(node)
                const key = productId ?? `pdp-${i}-${title}`
                return createPortal(
                    <div
                        data-testid="scratch-portal-poc"
                        style={{
                            background: 'lime',
                            color: 'black',
                            padding: '6px 10px',
                            marginTop: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 4
                        }}
                    >
                        PORTAL {i} · {title} · id: {productId ?? 'unresolved'}
                    </div>,
                    anchor,
                    key
                )
            })}
        </>
    )
}

export default ScratchPortalPoC
