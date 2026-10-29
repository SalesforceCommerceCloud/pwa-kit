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
 * When the id cannot be read from the URL with certainty, it is looked up through Shopper SEO
 * `getUrlMapping`, which applies the site's own URL rules. Until the lookup answers, and when it finds
 * no product, the link keeps the backend URL: the shopper lands on the backend product page, never on
 * a storefront 404.
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

/** Text reduced to unaccented letters and digits, e.g. 'Café Chair' and 'cafe-chair' -> 'cafechair'. */
const toKey = (text) =>
    text
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

/**
 * @returns {{url: URL, segment: string, isProductId: boolean}|undefined} The URL and its product
 *   segment (the `pid` parameter, or the last path segment minus `.html`), or undefined when `href`
 *   is not a product link on another origin
 */
const parseBackendProductUrl = (href, currentOrigin) => {
    let url
    try {
        url = new URL(href, currentOrigin)
    } catch {
        return undefined
    }
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.origin === currentOrigin) {
        return undefined
    }
    const pid = url.searchParams.get('pid') // `Product-Show?pid=<id>` when URL rules are off
    if (pid) return {url, segment: pid, isProductId: true}

    const lastSegment = url.pathname.split('/').filter(Boolean).pop()
    if (!lastSegment || !/\.html$/i.test(lastSegment)) return undefined
    let segment
    try {
        segment = decodeURIComponent(lastSegment.replace(/\.html$/i, ''))
    } catch {
        return undefined // malformed percent-escape
    }
    return segment ? {url, segment, isProductId: false} : undefined
}

/**
 * Returns the product id in a backend product URL, when the URL alone tells it for certain.
 *
 * The id is the `pid` parameter, or comes from the last path segment minus `.html`, which is either
 * the bare id (`/<slug>/<id>.html`) or the name slug and id joined by `-` (`/<slug>-<id>.html`). Ids
 * may themselves contain `-`, and the slug follows the site's URL rules, so a segment with a `-` is
 * only split where the part before it matches `productName`, both reduced to unaccented letters and
 * digits. Any other segment with a `-` is ambiguous; look it up with `getProductUrlSegments`.
 *
 * @param {string} href - Link address
 * @param {string} [currentOrigin] - Storefront origin; links on it are already routable
 * @param {string} [productName] - Product name shown with the link
 * @returns {string|undefined} Product id, or undefined when it is ambiguous or the URL is not a product link on another origin
 */
export const getBackendProductId = (href, currentOrigin = window.location.origin, productName) => {
    const parsed = parseBackendProductUrl(href, currentOrigin)
    if (!parsed) return undefined
    const {segment, isProductId} = parsed
    if (isProductId || !segment.includes('-')) return segment

    const nameKey = productName ? toKey(productName) : ''
    if (!nameKey) return undefined
    // The last split that matches wins, so a repeated separator after the name stays out of the id.
    let productId
    for (let i = segment.indexOf('-'); i !== -1; i = segment.indexOf('-', i + 1)) {
        if (i + 1 < segment.length && toKey(segment.slice(0, i)) === nameKey) {
            productId = segment.slice(i + 1)
        }
    }
    return productId
}

/**
 * The URL segments to look a backend product URL up with in Shopper SEO `getUrlMapping`, most likely
 * first: the path without an SFRA `/s/<site>` prefix, then that path without a leading locale.
 *
 * @param {string} href - Link address
 * @param {string} [currentOrigin] - Storefront origin
 * @returns {string[]} Decoded URL segments; none when `href` is not a backend product link or already names the id
 */
export const getProductUrlSegments = (href, currentOrigin = window.location.origin) => {
    const parsed = parseBackendProductUrl(href, currentOrigin)
    if (!parsed || parsed.isProductId) return []
    let parts
    try {
        parts = parsed.url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    } catch {
        return []
    }
    if (parts[0] === 's' && parts.length > 2) parts = parts.slice(2)
    const segments = [parts.join('/')]
    if (parts.length > 1 && /^[a-z]{2}([_-][a-z]{2})?$/i.test(parts[0])) {
        segments.push(parts.slice(1).join('/'))
    }
    return segments
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

/**
 * Starts pointing agent product links at the storefront. Links already rewritten keep their
 * storefront address after it stops.
 *
 * A link whose id the URL does not tell for certain is looked up once per address with
 * `lookupProductId`, trying each of `getProductUrlSegments` in turn, and rewritten when the answer
 * comes back if it still has that address. A click before then, or on a link no lookup resolved,
 * is left to the browser.
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
 * @param {function(string): Promise<string|undefined>} [options.lookupProductId] - Product id a URL segment maps to, if any
 * @param {Document} [options.root] - Document to watch
 * @returns {function(): void} Stops the routing
 */
export const attachAgentProductLinkRouting = ({
    navigateToProduct,
    getProductHref,
    lookupProductId,
    root = document
}) => {
    let stopped = false
    /** Backend address -> product id, or null when it maps to none; set once its lookup answers. */
    const lookedUp = new Map()
    /** Backend addresses with a lookup in flight. */
    const pending = new Set()

    /** The product a link points at: the one we rewrote it for, else the one its backend address names. */
    const getLinkedProductId = (anchor) => {
        const own = rewritten.get(anchor)
        if (own && anchor.getAttribute('href') === own.href) return own.productId
        return (
            getBackendProductId(anchor.href, window.location.origin, getProductName(anchor)) ||
            lookedUp.get(anchor.href) ||
            undefined
        )
    }

    const writeHref = (anchor, productId) => {
        const href = getProductHref(productId)
        rewritten.set(anchor, {productId, href})
        if (anchor.getAttribute('href') !== href) anchor.setAttribute('href', href)
    }

    const lookUp = async (backendHref) => {
        for (const urlSegment of getProductUrlSegments(backendHref)) {
            try {
                const productId = await lookupProductId(urlSegment)
                if (productId) return productId
            } catch {
                // Not a known URL; try the next segment
            }
        }
        return undefined
    }

    const rewrite = (anchor) => {
        const productId = getLinkedProductId(anchor)
        if (productId) {
            writeHref(anchor, productId)
            return
        }
        const backendHref = anchor.href
        if (!lookupProductId || lookedUp.has(backendHref) || pending.has(backendHref)) return
        if (!getProductUrlSegments(backendHref).length) return
        pending.add(backendHref)
        lookUp(backendHref).then((foundId) => {
            pending.delete(backendHref)
            lookedUp.set(backendHref, foundId || null)
            if (stopped || !foundId) return
            // Every link still on that address, including ones drawn while the lookup ran
            findAgentProductLinksIn(root)
                .filter((link) => link.href === backendHref)
                .forEach((link) => writeHref(link, foundId))
        })
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
        stopped = true
        observer.disconnect()
        root.removeEventListener('click', onClick)
    }
}
