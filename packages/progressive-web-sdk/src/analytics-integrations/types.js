/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @fileOverview Analytics Types and Schemas
 * @module progressive-web-sdk/dist/analytics-integrations/types
 */

/**
 * @private
 */
import {ValidationError} from './errors'
;('') // eslint-disable-line
// TODO: https://github.com/jsdoc/jsdoc/issues/1718

/**
 * Analytics type 'pageview'. Uses schema: `pageview`.
 * @const PAGEVIEW
 */
export const PAGEVIEW = 'pageview'

/**
 * Analytics type 'offline'. Uses schema: `offline`.
 * @const OFFLINE
 */
export const OFFLINE = 'offline'

/**
 * Analytics type 'uiInteraction'. Uses schema: `uiInteraction`.
 * @const UIINTERACTION
 */
export const UIINTERACTION = 'uiInteraction'

/**
 * Analytics type 'performance'. Uses schema: `performance`.
 * @const PERFORMANCE
 */
export const PERFORMANCE = 'performance'

/**
 * Analytics event type 'addToCart'. Uses schema `shoppingList`.
 * @const ADDTOCART
 */
export const ADDTOCART = 'addToCart'

/**
 * Analytics type 'removeFromCart'. Uses schema `shoppingList`.
 * @const REMOVEFROMCART
 */
export const REMOVEFROMCART = 'removeFromCart'

/**
 * Analytics type 'addToWishlist'. Uses schema `shoppingList`.
 * @const ADDTOWISHLIST
 */
export const ADDTOWISHLIST = 'addToWishlist'

/**
 * Analytics type 'removeFromWishlist'. Uses schema `shoppingList`.
 * @const REMOVEFROMWISHLIST
 */
export const REMOVEFROMWISHLIST = 'removeFromWishlist'

/**
 * Analytics type 'purchase'. Uses schema `purchase`.
 * @const PURCHASE
 */
export const PURCHASE = 'purchase'

/**
 * Analytics type 'productImpression'. Uses schema `product`.
 * @const PRODUCTIMPRESSION
 */
export const PRODUCTIMPRESSION = 'productImpression'

/**
 * Analytics type 'applePayOptionDisplayed'. No schema.
 * @const APPLEPAYOPTIONDISPLAYED
 */
export const APPLEPAYOPTIONDISPLAYED = 'applePayOptionDisplayed'

/**
 * Analytics type 'applePayButtonDisplayed'. No schema.
 * @const APPLEPAYBUTTONDISPLAYED
 */
export const APPLEPAYBUTTONDISPLAYED = 'applePayButtonDisplayed'

/**
 * Analytics type 'applePayButtonClicked'. No schema.
 * @const APPLEPAYBUTTONCLICKED
 */
export const APPLEPAYBUTTONCLICKED = 'applePayButtonClicked'

/**
 * Analytics type 'locale'. Uses schema `locale`.
 * @const LOCALE
 */
export const LOCALE = 'locale'

/**
 * This represents a pageview on your site.
 * Analytics type 'error'. Uses schema: `error`.
 * @const ERROR
 */
export const ERROR = 'error'

/**
 * Page schema
 *
 * @typedef {Object} page
 * @property {String} templateName - (required) the template name that was used to
 *    render the page, eg. `product-details-page`
 * @property {String} location - the value of window.location, if available.
 * @property {String} path - the path segment of the current URL, if available.
 * @property {String} title - the title of the rendered page.
 */
export const page = {
    templateName: {required: true},
    location: {required: false},
    path: {required: false},
    title: {required: false}
}

/**
 * Offline schema
 *
 * @typedef {Object} offline
 * @property {Number} startTime - the time your site went offline.
 */
export const offline = {
    startTime: {required: false}
}

/**
 * UI Interaction schema
 *
 * @typedef {Object} uiInteraction
 * @property {String} subject - (required) the subject responsible for triggering the UI Interaction eg. `user`, `app`.
 * @property {String} action - (required) the UI action eg. `Focus`, `Change`, `Open`, `Click`, `Blur`, `Close`, `Display`, `Receive`, `Swipe`.
 * @property {String} object - (required) the DOM element name eg. `Button`, `Element`, `Input`, `Modal`.
 * @property {String} name - the name given by the attribute `data-analytics-name`.
 * @property {String} content - the DOM element value, or the content given by the attribute `data-analytics-content`
 */
export const uiInteraction = {
    subject: {required: true},
    action: {required: true},
    object: {required: true},
    name: {required: false},
    content: {required: false}
}

/**
 * Performance schema
 *
 * @typedef {Object} performance
 * @property {String} bundle - (required) the bundle type eg. `production`, `development`.
 * @property {Number} page_start - (required) the time when the page is navigated to before it is done loading.
 * @property {Number} timing_start - (required) time of hard navigation. {@link https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming/navigationStart}
 * @property {Number} mobify_start - (required) the time when the mobify tag loaded.
 * @property {Number} app_start - (required) the time to load the sandy tracking pixel.
 * @property {Number} full_page_load - (required) the time to load the page.
 * @property {Number} first_paint - (required) first paint. {@link https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming}
 * @property {Number} first_contentful_paint - (required) first contentful paint. {@link https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming}
 * @property {Number} time_to_interactive - (required) time to interactive. {@link https://github.com/GoogleChromeLabs/tti-polyfill#usage}
 * @property {Boolean} is_first_load - (required) true if this is an initial load, false if it is a subsequent load.
 */
export const performance = {
    bundle: {required: true},
    page_start: {required: true},
    timing_start: {required: true},
    mobify_start: {required: true},
    app_start: {required: true},
    full_page_load: {required: true},
    first_paint: {required: true},
    first_contentful_paint: {required: true},
    time_to_interactive: {required: true},
    is_first_load: {required: true}
}

/**
 * Product schema
 *
 * @typedef {Object} product
 * @property {String} id - (required) product id.
 * @property {String} name - (required) product name.
 * @property {String} category - product category.
 * @property {String} brand - product brand.
 * @property {String} variant - product variant.
 * @property {String} list - the name of the list the user encountered the product (i.e. search, bestseller)
 * @property {Number} position - the position of the product in the list it was encountered in.
 * @property {Number} price - price of product.
 * @property {Number} quantity - quantity of product selected.
 * @property {String} coupon - coupon used on product.
 * @property {Number} stock - number of product in stock.
 * @property {String} size - product size.
 * @property {String} color - product color.
 *
 */
export const product = {
    id: {required: true},
    name: {required: true},
    category: {required: false},
    brand: {required: false},
    variant: {required: false},
    list: {required: false},
    position: {required: false},
    price: {required: false, sanitizer: (x) => sanitizeMoney(x)},
    quantity: {required: false},
    coupon: {required: false},
    stock: {required: false},
    size: {required: false},
    color: {required: false}
}

/**
 * Shopping list schema
 *
 * @typedef {Object} shoppingList
 * @property {String} type - (required) type of shopping list (i.e. cart, wishlist)
 * @property {Number} count - (required) total number of cart line items.
 * @property {Number} subtotal - total price of all cart line items before shipping and taxes.
 * @property {Object} product - cart line item added to shopping list (see type: product).
 *
 */
export const shoppingList = {
    type: {required: true},
    count: {required: true},
    subtotal: {required: false, santizer: (x) => sanitizeMoney(x)},
    product: {required: true, instanceOf: product}
}

/**
 * Transaction schema
 *
 * @typedef {Object} transaction
 *
 * @property {String} id - (required) transaction id.
 * @property {String} affiliation - checkout method (i.e. Web, Paypal, Apple Pay, Google Store)
 * @property {Number} revenue - (required) grand total of purchase including shipping and taxes.
 * @property {Number} tax - tax on purchase.
 * @property {Number} shipping - shipping charge on purchase.
 * @property {String} list - purchase attribution - what affected this purchase? (i.e. Web push)
 * @property {Number} step - a number representing a step in the checkout process.
 * @property {Object} option - Additional options
 *
 */
export const transaction = {
    id: {required: true},
    affiliation: {required: false},
    revenue: {required: true, santizer: (x) => sanitizeMoney(x)},
    tax: {required: false, santizer: (x) => sanitizeMoney(x)},
    shipping: {required: false, santizer: (x) => sanitizeMoney(x)},
    list: {required: false},
    step: {required: false},
    option: {required: false}
}

/**
 * Purchase schema
 *
 * @typedef {Object} purchase
 * @property {Object} transaction - (required) transaction of purchase (see type: transaction)
 * @property {Array} products - (required) products in purchase (see type: product).
 */
export const purchase = {
    transaction: {required: true, instanceOf: transaction},
    products: {required: true, arrayOf: product}
}

/**
 * Error schema
 *
 * @typedef {Object} error
 * @property {String} name - (required) The name of component the error originated from.
 * @property {String} content - Error content i.e. the form field that has an error, error stack track,
 */
export const error = {
    name: {required: true},
    content: {required: false}
}

/**
 * This represents the locale of your site
 * @typedef {Object} locale
 * @property {String} locale locale ISO code.
 *
 */
export const locale = {
    locale: {required: true}
}

/**
 * Validate and sanitizes an object against its spec.
 *
 * @param {Object} spec The specification used to validate the object.
 * @param {Object} object The object to validate.
 *
 *
 * @private
 */
export const validate = (spec, object) => {
    if (!object || Object.entries(object).length <= 0) {
        throw new Error('Please provide Analytics data to track.')
    }

    const ret = Object.assign({}, object)
    Object.keys(spec).forEach((k) => {
        const {required, sanitizer, instanceOf, arrayOf} = spec[k]
        const defined = arrayOf ? ret.hasOwnProperty(k) && ret[k].length > 0 : ret.hasOwnProperty(k)
        if (required && !defined) {
            throw new ValidationError()
        }
        if (defined && instanceOf) {
            ret[k] = validate(instanceOf, ret[k])
        }
        if (defined && arrayOf) {
            ret[k].forEach((obj, i) => {
                ret[k][i] = validate(arrayOf, obj)
            })
        }
        if (defined && sanitizer && !arrayOf && !instanceOf) {
            ret[k] = sanitizer(ret[k])
        }
    })
    return ret
}

export const sanitizeMoney = (value) => {
    let sanitizedValue = ''
    value = value.toString().match(/[\d,'./]/g)
    if (!value || value.length <= 0) return sanitizedValue

    value = value.join('').replace(/[,'.]$/, '') // leave only valid monetary syntaxes and strip trailing syntaxs
    const match = value.match(/(.*?)(([,'./])(\d{1,2}))?$/) // break money string (ie: '10,000' , '.', '99')

    const firstMatch = match[1].match(/\d/g) // digits only for first match (ie. '10000')
    if (firstMatch) {
        sanitizedValue = firstMatch.join('')

        if (match[3] && match[4]) {
            sanitizedValue += `.${match[4]}` // convert float seprator to period
        }
    }

    return sanitizedValue
}

export const renameKey = (object, oldName, newName) => {
    if (!object[oldName]) throw new Error(`key ${oldName} does not exist`)
    const value = object[oldName]
    object[newName] = value
    delete object[oldName]
    return object
}
