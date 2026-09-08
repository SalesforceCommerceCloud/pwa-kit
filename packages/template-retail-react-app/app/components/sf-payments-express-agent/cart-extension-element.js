/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Custom element the Cimulate widget mounts inside its cart summary card when the
// storefront registers `CartExtension: CART_EXTENSION_TAG_NAME`.
//
// The element itself owns no UI. Its job is to be a mount point that our React
// adapter (rendered in the host tree from `_app/index.jsx`) portals into — so the
// portalled subtree inherits QueryClient / CommerceApiProvider / ChakraProvider /
// SF Payments state without a separate provider bridge. Cimulate stays payment-
// agnostic; the browser's custom-element lifecycle is what tells us when to
// mount / unmount.

export const CART_EXTENSION_TAG_NAME = 'sf-cart-extension'

let version = 0
const listeners = new Set()

const bump = () => {
    version += 1
    listeners.forEach((notify) => notify())
}

export const subscribeToCartExtensionElements = (notify) => {
    listeners.add(notify)
    return () => listeners.delete(notify)
}

export const getCartExtensionVersion = () => version

class SfCartExtension extends HTMLElement {
    static registry = new Set()

    connectedCallback() {
        SfCartExtension.registry.add(this)
        bump()
    }

    disconnectedCallback() {
        SfCartExtension.registry.delete(this)
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

export const getCartExtensionElements = () => Array.from(SfCartExtension.registry)

export const registerCartExtensionElement = () => {
    if (typeof window === 'undefined') return
    if (window.customElements?.get(CART_EXTENSION_TAG_NAME)) return
    window.customElements.define(CART_EXTENSION_TAG_NAME, SfCartExtension)
}
