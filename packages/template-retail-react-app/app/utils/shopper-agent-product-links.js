/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Points the Shopper Agent's product links at the PWA Kit product page.
 *
 * The backend sends each product link in the legacy SFRA format on the backend origin, e.g.
 * `https://<instance>.demandware.net/en_US/dipsea-tie-headband-2040793A5H.html`.
 * The widget renders it as a plain `<a href>`, and its `onNavigate` hook only fires for same-origin
 * links, so a click leaves the storefront for the SFRA page. This module reads the product id from
 * that URL and:
 *
 * - rewrites the link's `href` to the storefront product address, so hover, copy-link,
 *   Cmd/Ctrl-click, middle-click and links set to open in a new tab all use it;
 * - opens the product through the router on an unmodified, same-tab primary click.
 *
 * Only links in the widget's product slots are touched, never links in agent message text. Those
 * slots are found by the widget's CSS classes (`cim-widget-*`). If a widget release renames them,
 * links keep the backend URL and nothing breaks.
 */

/** Widget markup that holds a product link. */
const PRODUCT_LINK_SCOPES = [
    '.cim-widget-msg-product-card', // carousel card: image and name links
    '.cim-widget-msg-pdp__title-link', // product detail card title (the link itself)
    '.cim-widget-product-comparison__product-col' // comparison column: image and name links
]

/** A link inside a scope, or the scope element when it is the link. */
const PRODUCT_LINK_SELECTOR = PRODUCT_LINK_SCOPES.flatMap((scope) => [
    `${scope} a[href]`,
    `a${scope}[href]`
]).join(',')

/** Free text inside a card (the description) can hold any link, so it is never touched. */
const FREE_TEXT_SCOPE = '.cim-widget-msg-product-card__description'

/** Widget markup around a product link that also holds the product name. */
const PRODUCT_NAME_SCOPE =
    '.cim-widget-msg-product-card, .cim-widget-product-comparison__product-col'
const PRODUCT_NAME_SELECTOR =
    '.cim-widget-msg-product-card__title-link, .cim-widget-msg-product-card__title, .cim-widget-product-comparison__name-link'

/** The URL slug B2C derives from a product name, e.g. 'Dipsea Tie Headband' -> 'dipsea-tie-headband'. */
const toSlug = (name) =>
    name
        .toLowerCase()
        .replace(/['\u2019]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

/**
 * Returns the product id in a backend product URL. The last path segment minus `.html` is either the
 * bare id (`/<slug>/<id>.html`) or the name slug and id joined by `-` (`/<slug>-<id>.html`); in the
 * latter case the slug of `productName` is stripped. Ids may themselves contain `-`, so the slug is
 * only stripped when it matches the name.
 *
 * @param {string} href - Link address
 * @param {string} [currentOrigin] - Storefront origin; links on it are already routable
 * @param {string} [productName] - Product name shown with the link
 * @returns {string|undefined} Product id, or undefined when the URL is not a product link on another origin
 */
export const getBackendProductId = (href, currentOrigin = window.location.origin, productName) => {
    let url
    try {
        url = new URL(href, currentOrigin)
    } catch {
        return undefined
    }
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.origin === currentOrigin) {
        return undefined
    }

    const lastSegment = url.pathname.split('/').filter(Boolean).pop()
    if (!lastSegment || !/\.html$/i.test(lastSegment)) return undefined
    let segment
    try {
        segment = decodeURIComponent(lastSegment.replace(/\.html$/i, ''))
    } catch {
        return undefined // malformed percent-escape
    }
    const slugPrefix = productName ? `${toSlug(productName)}-` : ''
    if (slugPrefix.length > 1 && segment.toLowerCase().startsWith(slugPrefix)) {
        segment = segment.slice(slugPrefix.length)
    }
    return segment || undefined
}

/** The product name shown with a widget product link, or '' when none is found. */
const getProductName = (anchor) => {
    const scope = anchor.closest(PRODUCT_NAME_SCOPE)
    const nameElement = scope ? scope.querySelector(PRODUCT_NAME_SELECTOR) : anchor
    const image = anchor.querySelector('img[alt]')
    return (nameElement?.textContent || '').trim() || (image?.getAttribute('alt') || '').trim()
}

const isAgentProductLink = (anchor) =>
    anchor.matches(PRODUCT_LINK_SELECTOR) && !anchor.closest(FREE_TEXT_SCOPE)

/**
 * @param {EventTarget|null} target - Click target
 * @returns {HTMLAnchorElement|null} The widget product link the click landed on, or null for any other link
 */
export const findAgentProductLink = (target) => {
    if (!(target instanceof Element)) return null
    const anchor = target.closest('a[href]')
    return anchor instanceof HTMLAnchorElement && isAgentProductLink(anchor) ? anchor : null
}

/** The widget product links in a subtree, including `node` itself. */
const findAgentProductLinksIn = (node) => {
    const links = Array.from(node.querySelectorAll(PRODUCT_LINK_SELECTOR))
    if (node instanceof HTMLAnchorElement) links.push(node)
    return links.filter(isAgentProductLink)
}

/**
 * Links rewritten so far, with the id and address written. Tells our own `href` from one the widget
 * set later (it reuses a link for another product), and still routes a link we already rewrote.
 */
const rewritten = new WeakMap()

/** The product a link points at: the one we rewrote it for, else the one in a backend address. */
const getLinkedProductId = (anchor) => {
    const own = rewritten.get(anchor)
    if (own && anchor.getAttribute('href') === own.href) return own.productId
    return getBackendProductId(anchor.href, window.location.origin, getProductName(anchor))
}

/**
 * Starts pointing agent product links at the storefront. Links already rewritten keep their
 * storefront address after it stops.
 *
 * The click listener runs in the bubble phase, after the widget's own click handler, and skips an
 * event that is already `defaultPrevented`.
 *
 * The observer watches the whole document because the widget renders its dialogs outside its own
 * container. Its own `href` write triggers one more pass, which finds the address already correct
 * and writes nothing, so it cannot loop.
 *
 * @param {Object} options
 * @param {function(string): void} options.navigateToProduct - Opens the product page through the router
 * @param {function(string): string} options.getProductHref - Storefront product address, site and locale prefix included
 * @param {Document} [options.root] - Document to watch
 * @returns {function(): void} Stops the routing
 */
export const attachAgentProductLinkRouting = ({
    navigateToProduct,
    getProductHref,
    root = document
}) => {
    const rewrite = (anchor) => {
        const productId = getLinkedProductId(anchor)
        if (!productId) return
        const href = getProductHref(productId)
        rewritten.set(anchor, {productId, href})
        if (anchor.getAttribute('href') !== href) anchor.setAttribute('href', href)
    }

    const onClick = (event) => {
        if (event.defaultPrevented || event.button !== 0) return
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

        const anchor = findAgentProductLink(event.target)
        if (!anchor || (anchor.target && anchor.target !== '_self')) return

        const productId = getLinkedProductId(anchor)
        if (!productId) return

        event.preventDefault()
        navigateToProduct(productId)
    }

    // The widget draws a link with the backend address each time it draws a card, and sets it again
    // when it reuses a link for another product.
    const observer = new MutationObserver((records) => {
        records.forEach((record) => {
            if (record.type === 'attributes') {
                if (
                    record.target instanceof HTMLAnchorElement &&
                    isAgentProductLink(record.target)
                ) {
                    rewrite(record.target)
                }
            } else {
                record.addedNodes.forEach((node) => {
                    if (node instanceof Element) findAgentProductLinksIn(node).forEach(rewrite)
                })
            }
        })
    })

    findAgentProductLinksIn(root).forEach(rewrite)
    observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href']
    })
    root.addEventListener('click', onClick)

    return () => {
        observer.disconnect()
        root.removeEventListener('click', onClick)
    }
}
