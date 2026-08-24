/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Custom element the Cimulate widget mounts inside its product detail card when the
// storefront registers `ProductTileExtension: TILE_EXTENSION_TAG_NAME`.
//
// The element itself owns no UI. Its job is to be a mount point that our React
// adapter (rendered in the host tree from `_app/index.jsx`) portals into — so the
// portalled subtree inherits QueryClient / CommerceApiProvider / ChakraProvider /
// SF Payments state without a separate provider bridge. Cimulate stays payment-
// agnostic; the browser's custom-element lifecycle is what tells us when to
// mount / unmount.

export const TILE_EXTENSION_TAG_NAME = 'sf-product-tile-extension'

let version = 0
const listeners = new Set()

const bump = () => {
    version += 1
    listeners.forEach((notify) => notify())
}

export const subscribeToTileExtensionElements = (notify) => {
    listeners.add(notify)
    return () => listeners.delete(notify)
}

export const getTileExtensionVersion = () => version

class SfProductTileExtension extends HTMLElement {
    static registry = new Set()

    connectedCallback() {
        SfProductTileExtension.registry.add(this)
        bump()
    }

    disconnectedCallback() {
        SfProductTileExtension.registry.delete(this)
        bump()
    }

    set props(value) {
        this._cimProps = value
        bump()
    }

    get props() {
        return this._cimProps
    }
}

export const getTileExtensionElements = () => Array.from(SfProductTileExtension.registry)

export const registerTileExtensionElement = () => {
    if (typeof window === 'undefined') return
    if (window.customElements?.get(TILE_EXTENSION_TAG_NAME)) return
    window.customElements.define(TILE_EXTENSION_TAG_NAME, SfProductTileExtension)
}
