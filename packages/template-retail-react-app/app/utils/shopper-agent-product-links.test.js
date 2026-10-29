/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    attachAgentProductLinkRouting,
    findAgentProductLink,
    getBackendProductId,
    getProductUrlSegments
} from '@salesforce/retail-react-app/app/utils/shopper-agent-product-links'

const ORIGIN = 'https://storefront.example.com'
const SFRA_URL = 'https://backend.example.com/en_US/dipsea-tie-headband-2040793A5H.html'
const SFRA_SITE_URL = 'https://backend.example.com/s/RefArch/chairs/DH-387.html?lang=en_US'

// Markup matching what the Commerce Client widget renders for each product slot.
const WIDGET_MARKUP = `
<div id="widget">
  <div class="commerce-client-shopper-agent cim-widget-msg">
    <p><a id="message-link" href="https://help.example.com/returns.html">Returns</a></p>
  </div>
  <div class="commerce-client-shopper-agent cim-widget-msg-product-card">
    <div class="commerce-client-shopper-agent cim-widget-msg-product-card__image-wrapper">
      <a id="card-image" href="${SFRA_URL}" target="_self" rel="noopener"><img id="card-img" alt="Dipsea Tie Headband" src="https://img.example.com/a.jpg"></a>
    </div>
    <div class="commerce-client-shopper-agent cim-widget-msg-product-card__content">
      <a id="card-name" class="commerce-client-shopper-agent cim-widget-msg-product-card__title-link" href="${SFRA_URL}" target="_self" rel="noopener">Dipsea Tie Headband</a>
      <div class="commerce-client-shopper-agent cim-widget-msg-product-card__description"><a id="card-description-link" href="https://help.example.com/care-guide.html">Care guide</a></div>
    </div>
  </div>
  <div class="commerce-client-shopper-agent cim-widget-msg-pdp">
    <a id="pdp-title" class="commerce-client-shopper-agent cim-widget-msg-pdp__title-link" href="${SFRA_SITE_URL}" target="_self" rel="noopener noreferrer">Dream Chair</a>
  </div>
  <div class="commerce-client-shopper-agent cim-widget-product-comparison__product-col">
    <a id="comparison-image" href="${SFRA_SITE_URL}" target="_self" rel="noopener"><img alt="Dream Chair" src="https://img.example.com/b.jpg"></a>
    <a id="comparison-name" class="commerce-client-shopper-agent cim-widget-product-comparison__name-link" href="${SFRA_SITE_URL}" target="_self" rel="noopener">Dream Chair</a>
  </div>
</div>
<a id="page-link" href="${SFRA_URL}">Not in the widget</a>`

const byId = (id) => document.getElementById(id)
const hrefOf = (id) => byId(id).getAttribute('href')
const productHref = (productId) => `/us/en-US/product/${productId}`

/** What Shopper SEO `getUrlMapping` maps each URL segment to in these tests. */
const SEO_PRODUCTS = {'chairs/DH-387.html': 'DH-387', 'cafe-chair-DH-388.html': 'DH-388'}

/** Lets the MutationObserver deliver its records and pending lookups answer. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Dispatches a click and returns whether our listener prevented the browser's navigation. */
const click = (element, init = {}) => {
    let prevented = false
    // `window` runs after `document`, so this sees the result of our listener; it then blocks jsdom's navigation.
    const spy = (event) => {
        prevented = event.defaultPrevented
        event.preventDefault()
    }
    window.addEventListener('click', spy)
    element.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true, button: 0, ...init})
    )
    window.removeEventListener('click', spy)
    return prevented
}

describe('getBackendProductId', () => {
    test.each([
        ['https://backend.example.com/en_US/x2040793A5H.html#reviews', 'x2040793A5H'],
        ['https://backend.example.com/s/RefArch/x/25589712M.HTML', '25589712M'],
        ['https://backend.example.com/s/RefArch/x/red%20shoe.html', 'red shoe'],
        ['https://backend.example.com/s/RefArch/Product-Show?pid=DH-387', 'DH-387'],
        [
            'https://backend.example.com/on/demandware.store/Sites-RefArch-Site/en_US/Product-Show?pid=25589712M',
            '25589712M'
        ]
    ])('reads the product id from %s', (href, id) => {
        expect(getBackendProductId(href, ORIGIN)).toBe(id)
    })

    test.each([
        [SFRA_URL, 'Dipsea Tie Headband', '2040793A5H'],
        ['https://backend.example.com/en_US/womens-v-neck-DH-387.html', "Women's V-Neck", 'DH-387'],
        ['https://backend.example.com/en_US/cafe-chair-DH-387.html', 'Café Chair', 'DH-387'],
        ['https://backend.example.com/en_US/caf-chair-DH-387.html', 'Caf Chair', 'DH-387'],
        [
            'https://backend.example.com/en_US/dream--chair--25589712M.html',
            'Dream Chair',
            '25589712M'
        ],
        ['https://backend.example.com/en_US/t-shirt-TS-1.html', 'T-Shirt', 'TS-1']
    ])('strips the name slug from %s when the product is %s', (href, name, id) => {
        expect(getBackendProductId(href, ORIGIN, name)).toBe(id)
    })

    test.each([
        ['the name does not match the slug', SFRA_URL, 'Some Other Product'],
        ['there is no name', SFRA_URL, undefined],
        ['the name reduces to nothing', SFRA_URL, '—'],
        ['the id itself has a dash', SFRA_SITE_URL, undefined],
        [
            'the name is the whole segment',
            'https://backend.example.com/en_US/dream-chair.html',
            'Dream Chair'
        ]
    ])('gives no id, to look up instead, when %s', (_label, href, name) => {
        expect(getBackendProductId(href, ORIGIN, name)).toBeUndefined()
    })

    test.each([
        ['a link on the storefront itself', `${ORIGIN}/us/en-US/product/25589712M`],
        ['a same-origin .html link', `${ORIGIN}/legal/terms.html`],
        ['a backend link that is not a product page', 'https://backend.example.com/s/RefArch/cart'],
        ['an empty .html segment', 'https://backend.example.com/s/RefArch/.html'],
        ['a non-http scheme', 'javascript:alert(1);//x.html'],
        ['a malformed percent-escape', 'https://backend.example.com/x/%E0%A4%A.html'],
        ['text that is not a URL', 'http://']
    ])('ignores %s', (_label, href) => {
        expect(getBackendProductId(href, ORIGIN)).toBeUndefined()
    })
})

describe('getProductUrlSegments', () => {
    test.each([
        [
            SFRA_URL,
            ['en_US/dipsea-tie-headband-2040793A5H.html', 'dipsea-tie-headband-2040793A5H.html']
        ],
        [SFRA_SITE_URL, ['chairs/DH-387.html']],
        [
            'https://backend.example.com/s/RefArch/en-GB/caf%C3%A9-chair-1.html',
            ['en-GB/café-chair-1.html', 'café-chair-1.html']
        ],
        ['https://backend.example.com/dream-chair-1.html', ['dream-chair-1.html']]
    ])('looks %s up as %j', (href, segments) => {
        expect(getProductUrlSegments(href, ORIGIN)).toEqual(segments)
    })

    test.each([
        ['a link on the storefront itself', `${ORIGIN}/x/dream-chair-1.html`],
        [
            'a link that names the id',
            'https://backend.example.com/s/RefArch/Product-Show?pid=DH-387'
        ],
        ['a backend link that is not a product page', 'https://backend.example.com/s/RefArch/cart'],
        ['a malformed percent-escape', 'https://backend.example.com/%E0%A4/x-1.html']
    ])('looks nothing up for %s', (_label, href) => {
        expect(getProductUrlSegments(href, ORIGIN)).toEqual([])
    })
})

describe('findAgentProductLink', () => {
    beforeEach(() => {
        document.body.innerHTML = WIDGET_MARKUP
    })

    test.each(['card-image', 'card-name', 'pdp-title', 'comparison-image', 'comparison-name'])(
        'finds the product link %s',
        (id) => {
            expect(findAgentProductLink(byId(id))).toBe(byId(id))
        }
    )

    test('finds the link when the click lands on the image inside it', () => {
        expect(findAgentProductLink(byId('card-img'))).toBe(byId('card-image'))
    })

    test.each(['message-link', 'card-description-link', 'page-link'])(
        'ignores %s, which is not a product link',
        (id) => {
            expect(findAgentProductLink(byId(id))).toBeNull()
        }
    )

    test('ignores a missing target', () => {
        expect(findAgentProductLink(null)).toBeNull()
    })
})

describe('attachAgentProductLinkRouting', () => {
    let navigateToProduct
    let stop

    let lookupProductId

    beforeEach(async () => {
        document.body.innerHTML = WIDGET_MARKUP
        navigateToProduct = jest.fn()
        lookupProductId = jest.fn(async (urlSegment) => SEO_PRODUCTS[urlSegment])
        stop = attachAgentProductLinkRouting({
            navigateToProduct,
            getProductHref: productHref,
            lookupProductId
        })
        await flush() // the product detail and comparison links (`DH-387`) are looked up
    })

    afterEach(() => {
        stop()
        document.body.innerHTML = ''
    })

    describe('clicks', () => {
        test.each([
            ['card-image', '2040793A5H'],
            ['card-img', '2040793A5H'],
            ['card-name', '2040793A5H'],
            ['pdp-title', 'DH-387'],
            ['comparison-image', 'DH-387'],
            ['comparison-name', 'DH-387']
        ])('sends a plain click on %s to the product page', (id, productId) => {
            expect(click(byId(id))).toBe(true)
            expect(navigateToProduct).toHaveBeenCalledTimes(1)
            expect(navigateToProduct).toHaveBeenCalledWith(productId)
        })

        test.each([
            ['ctrl', {ctrlKey: true}],
            ['cmd', {metaKey: true}],
            ['shift', {shiftKey: true}],
            ['alt', {altKey: true}],
            ['middle button', {button: 1}]
        ])('leaves a %s click to the browser', (_label, init) => {
            expect(click(byId('card-name'), init)).toBe(false)
            expect(navigateToProduct).not.toHaveBeenCalled()
        })

        test('leaves a link that opens in a new tab to the browser', () => {
            byId('card-name').setAttribute('target', '_blank')
            expect(click(byId('card-name'))).toBe(false)
            expect(navigateToProduct).not.toHaveBeenCalled()
        })

        test('leaves a click another handler already handled', () => {
            document.body.addEventListener('click', (event) => event.preventDefault(), {
                once: true
            })
            click(byId('card-name'))
            expect(navigateToProduct).not.toHaveBeenCalled()
        })

        test('ignores links that are not agent product links', () => {
            ;['message-link', 'card-description-link', 'page-link'].forEach((id) => {
                expect(click(byId(id))).toBe(false)
            })
            expect(navigateToProduct).not.toHaveBeenCalled()
        })

        test('ignores a product link that points at another storefront page', () => {
            byId('card-name').setAttribute('href', `${window.location.origin}/us/en-US/cart`)
            expect(click(byId('card-name'))).toBe(false)
            expect(navigateToProduct).not.toHaveBeenCalled()
        })

        test("runs after the widget's own click handler", () => {
            let preventedWhenWidgetRan
            document.body.addEventListener(
                'click',
                (event) => {
                    preventedWhenWidgetRan = event.defaultPrevented
                },
                {once: true}
            )
            expect(click(byId('card-name'))).toBe(true)
            expect(preventedWhenWidgetRan).toBe(false)
        })

        test('routes a link the widget just pointed at another product, before the rewrite has run', () => {
            byId('card-name').setAttribute('href', SFRA_SITE_URL)
            expect(click(byId('card-name'))).toBe(true)
            expect(navigateToProduct).toHaveBeenCalledTimes(1)
            expect(navigateToProduct).toHaveBeenCalledWith('DH-387')
        })

        test('stops routing once detached', () => {
            stop()
            expect(click(byId('card-name'))).toBe(false)
            expect(navigateToProduct).not.toHaveBeenCalled()
        })
    })

    describe('link addresses', () => {
        test.each([
            ['card-image', '2040793A5H'],
            ['card-name', '2040793A5H'],
            ['pdp-title', 'DH-387'],
            ['comparison-image', 'DH-387'],
            ['comparison-name', 'DH-387']
        ])('points %s at the storefront product page once attached', (id, productId) => {
            expect(hrefOf(id)).toBe(`/us/en-US/product/${productId}`)
        })

        test('leaves links that are not agent product links alone', async () => {
            await flush()
            expect(hrefOf('message-link')).toBe('https://help.example.com/returns.html')
            expect(hrefOf('card-description-link')).toBe('https://help.example.com/care-guide.html')
            expect(hrefOf('page-link')).toBe(SFRA_URL)
        })

        test('points a card the widget draws later at the storefront', async () => {
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg-product-card"><a id="late-card" href="${SFRA_SITE_URL}">Dream Chair</a></div>`
            )
            await flush()
            expect(hrefOf('late-card')).toBe('/us/en-US/product/DH-387')
        })

        test('points a link added to a card that is already on the page at the storefront', async () => {
            byId('card-name').parentElement.insertAdjacentHTML(
                'beforeend',
                `<a id="late-link" href="${SFRA_SITE_URL}">Dream Chair</a>`
            )
            await flush()
            expect(hrefOf('late-link')).toBe('/us/en-US/product/DH-387')
        })

        test('points a product detail title the widget draws later at the storefront', async () => {
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<a id="late-pdp" class="cim-widget-msg-pdp__title-link" href="${SFRA_SITE_URL}">Dream Chair</a>`
            )
            await flush()
            expect(hrefOf('late-pdp')).toBe('/us/en-US/product/DH-387')
        })

        test('leaves links the widget draws later outside the product slots alone', async () => {
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg"><a id="late-text" href="${SFRA_SITE_URL}">In text</a></div>
                 <div class="cim-widget-msg-product-card">
                   <div class="cim-widget-msg-product-card__description"><a id="late-description" href="${SFRA_SITE_URL}">Description</a></div>
                 </div>`
            )
            await flush()
            expect(hrefOf('late-text')).toBe(SFRA_SITE_URL)
            expect(hrefOf('late-description')).toBe(SFRA_SITE_URL)
        })

        test('follows a link the widget reuses for another product', async () => {
            byId('card-name').setAttribute('href', SFRA_SITE_URL)
            await flush()
            expect(hrefOf('card-name')).toBe('/us/en-US/product/DH-387')
        })

        test('settles instead of rewriting forever', async () => {
            const getProductHref = jest.fn(productHref)
            stop()
            stop = attachAgentProductLinkRouting({
                navigateToProduct,
                getProductHref,
                lookupProductId
            })

            byId('card-name').setAttribute('href', SFRA_SITE_URL) // the widget reuses the link
            await flush()
            const callsOnceSettled = getProductHref.mock.calls.length
            expect(hrefOf('card-name')).toBe('/us/en-US/product/DH-387')

            await flush()
            await flush()
            expect(getProductHref).toHaveBeenCalledTimes(callsOnceSettled)
        })

        test('keeps the storefront address once detached, and leaves links drawn after that alone', async () => {
            stop()
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg-product-card"><a id="after-stop" href="${SFRA_SITE_URL}">Dream Chair</a></div>`
            )
            await flush()
            expect(hrefOf('card-name')).toBe('/us/en-US/product/2040793A5H')
            expect(hrefOf('after-stop')).toBe(SFRA_SITE_URL)
        })

        test('reads the id from the URL without a lookup when the name matches', () => {
            expect(lookupProductId).not.toHaveBeenCalledWith(
                expect.stringContaining('dipsea-tie-headband')
            )
        })

        test('looks each backend address up once, however many links share it', () => {
            expect(lookupProductId).toHaveBeenCalledTimes(1)
            expect(lookupProductId).toHaveBeenCalledWith('chairs/DH-387.html')
        })

        test('looks up a card whose name does not match its slug, and points it at the product found', async () => {
            const href = 'https://backend.example.com/cafe-chair-DH-388.html'
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg-product-card"><a id="late-cafe" href="${href}">Cozy Chair</a></div>`
            )
            await flush()
            expect(lookupProductId).toHaveBeenCalledWith('cafe-chair-DH-388.html')
            expect(hrefOf('late-cafe')).toBe('/us/en-US/product/DH-388')
            expect(click(byId('late-cafe'))).toBe(true)
            expect(navigateToProduct).toHaveBeenCalledWith('DH-388')
        })

        test('tries the path without its locale when the full path is not known', async () => {
            const href = 'https://backend.example.com/en_US/cafe-chair-DH-388.html'
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg-product-card"><a id="late-cafe" href="${href}">Cozy Chair</a></div>`
            )
            await flush()
            expect(lookupProductId).toHaveBeenCalledWith('en_US/cafe-chair-DH-388.html')
            expect(lookupProductId).toHaveBeenCalledWith('cafe-chair-DH-388.html')
            expect(hrefOf('late-cafe')).toBe('/us/en-US/product/DH-388')
        })

        test('leaves a link to the browser while its lookup runs', async () => {
            let answer
            lookupProductId.mockImplementationOnce(
                () => new Promise((resolve) => (answer = resolve))
            )
            const href = 'https://backend.example.com/cafe-chair-DH-388.html'
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg-product-card"><a id="late-cafe" href="${href}">Cozy Chair</a></div>`
            )
            await flush()
            expect(click(byId('late-cafe'))).toBe(false)
            expect(hrefOf('late-cafe')).toBe(href)

            answer('DH-388')
            await flush()
            expect(hrefOf('late-cafe')).toBe('/us/en-US/product/DH-388')
        })

        test.each([
            ['finds no product', async () => undefined],
            ['fails', async () => Promise.reject(new Error('404'))]
        ])(
            'keeps the backend address, never a storefront 404, when the lookup %s',
            async (_label, impl) => {
                lookupProductId.mockImplementation(impl)
                const href = 'https://backend.example.com/en_US/cafe-chair-DH-388.html'
                byId('widget').insertAdjacentHTML(
                    'beforeend',
                    `<div class="cim-widget-msg-product-card"><a id="late-cafe" href="${href}">Cozy Chair</a></div>`
                )
                await flush()
                expect(hrefOf('late-cafe')).toBe(href)
                expect(click(byId('late-cafe'))).toBe(false)
                expect(navigateToProduct).not.toHaveBeenCalled()
            }
        )

        test('keeps the backend address of an ambiguous link when there is no lookup', () => {
            stop()
            document.body.innerHTML = WIDGET_MARKUP
            stop = attachAgentProductLinkRouting({navigateToProduct, getProductHref: productHref})
            expect(hrefOf('card-name')).toBe('/us/en-US/product/2040793A5H')
            expect(hrefOf('pdp-title')).toBe(SFRA_SITE_URL)
        })

        test('does not rewrite links once detached, even when a lookup answers later', async () => {
            let answer
            lookupProductId.mockImplementationOnce(
                () => new Promise((resolve) => (answer = resolve))
            )
            const href = 'https://backend.example.com/cafe-chair-DH-388.html'
            byId('widget').insertAdjacentHTML(
                'beforeend',
                `<div class="cim-widget-msg-product-card"><a id="late-cafe" href="${href}">Cozy Chair</a></div>`
            )
            await flush()
            stop()
            answer('DH-388')
            await flush()
            expect(hrefOf('late-cafe')).toBe(href)
        })

        test('rewrites links again, and still routes them, when attached with a new address (locale switch)', () => {
            stop()
            stop = attachAgentProductLinkRouting({
                navigateToProduct,
                getProductHref: (productId) => `/fr/fr-FR/product/${productId}`
            })

            expect(hrefOf('card-name')).toBe('/fr/fr-FR/product/2040793A5H')
            expect(hrefOf('pdp-title')).toBe('/fr/fr-FR/product/DH-387')
            expect(click(byId('card-name'))).toBe(true)
            expect(navigateToProduct).toHaveBeenCalledWith('2040793A5H')
        })
    })
})
