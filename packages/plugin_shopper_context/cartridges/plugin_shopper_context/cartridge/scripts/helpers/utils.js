'use strict';

/* global request */
var Cookie = require('dw/web/Cookie');

var { ALLOW_UNKNOWN_CLIENTS } = require('*/cartridge/scripts/config/constant');

var {
    getClientRegistry
} = require('*/cartridge/scripts/config/clientRegistry');

/**
 * @typedef {Object} ShopperContext
 * @property {string} sourceCode
 * @property {string[]} customerGroupIds
 * @property {string} effectiveDateTime
 * @property {Object} customQualifiers
 * @property {Object} assignmentQualifiers
 */

/**
 * Validates the given shopper context object against the client registry.
 * @param {string} clientId - client id to be validated against
 * @param {ShopperContext} shopperContext - shopper context to be validated
 * @return {boolean} - validation status
 */
function validateContext(clientId, shopperContext) {
    const clientRegistry = getClientRegistry();

    if (!clientRegistry[clientId]) {
        // client not in the registry
        // this means there will be no constraint on shopper context. Use this with caution if you
        // are using shopperJWT to set context
        return ALLOW_UNKNOWN_CLIENTS;
    }

    const clientRules = clientRegistry[clientId];
    // validate shopperContext against the allowed attributes
    if (!clientRules.allowSourceCode && shopperContext.sourceCode) {
        return false;
    }
    if (!clientRules.allowCustomerGroupIds && shopperContext.customerGroupIds) {
        return false;
    }
    if (
        !clientRules.allowEffectiveDateTime &&
        shopperContext.effectiveDateTime
    ) {
        return false;
    }
    if (!clientRules.allowCustomQualifiers && shopperContext.customQualifiers) {
        return false;
    }
    if (
        !clientRules.allowAssignmentQualifiers &&
        shopperContext.assignmentQualifiers
    ) {
        return false;
    }

    return true;
}

/**
 *
 * @param {Object[]} cookiesToSet - cookies to be added to response object.
 * @property {string} cookieToSet.value - value of cookie.
 * @property {number} cookieToSet.maxAge - time to live for cookie.
 * @param {Object} response - response object to set the cookies to. {dw.system.Response} if SLAS was triggered from onSession.
 * {res.base} if SLAS was triggered from Login Page.
 */
function setCookiesToResponse(cookiesToSet, response) {
    Object.keys(cookiesToSet).forEach(function (key) {
        // Append empty string to force string conversion and ensure access to match().
        // Otherwise value could be a number / boolean / null / undefined.
        var value = cookiesToSet[key].value + '';
        var maxAge = cookiesToSet[key].maxAge;
        response.addHttpCookie(createCookie(key, value, maxAge));
        // ECOM starts to throw a cookie maxValueLength warning at 1200 characters though the hard limit is 2000 characters.
        // If the value exceeds 1200 characters, we split it across multiple keys to remain under the threshold and avoid
        // warnings appearing in ECOM logs.
        // One case where this applies is the SLAS JWT, which typically exceeds 2000 characters.
        // var valueParts = value.match(/.{1,1199}/g);
        //
        // // Early exit if no chunking occured. Also handles the case where value is an empty string ie. when deleting cookies.
        // if (!valueParts || valueParts.length < 2) {
        //     response.addHttpCookie(createCookie(key, value, maxAge));
        //     return;
        // }
        //
        // var partCount = 1;
        // valueParts.forEach(function (valuePart) {
        //     var cookieKey = key;
        //
        //     // A bit of future-proofing here.
        //     // We omit adding the part to the first part of the key so we can more easily drop
        //     // part 2 and above once we can store the full value in a single cookie.
        //     // Results in the following: Part 1 is cc-at. Part 2 is cc-at_2, etc.
        //     if (partCount > 1) {
        //         cookieKey = cookieKey + '_' + partCount;
        //     }
        //     var cookie = createCookie(cookieKey, valuePart, maxAge);
        //     response.addHttpCookie(cookie);
        //     partCount += 1;
        // });
    });
}

/**
 * Creates the cookie
 * @param {string}name - cookie to be created
 * @param {string}value - refresh_token to be set as value
 * @param {number}age - age of the cookie
 * @returns {dw.web.Cookie} - new persistent cookie
 */
function createCookie(name, value, age) {
    var newCookie = new Cookie(name, value);
    newCookie.setHttpOnly(false); // set as required for PWA hybrid solution
    newCookie.setSecure(true);
    if (age) {
        newCookie.setMaxAge(age);
    }
    newCookie.setPath('/');
    return newCookie;
}
/**
 * Retrieves cookie
 * @param {string}name - cookie to retrieve
 * @returns {dw.web.Cookie} retrieved refresh_token cookie
 */
function getCookie(name) {
    var cookie;
    var cookies = request.getHttpCookies();
    var cookieCount = cookies.getCookieCount();
    for (var i = 0; i < cookieCount; i++) {
        if (name === cookies[i].getName()) {
            cookie = cookies[i];
            break;
        }
    }
    return cookie;
}

/**
 * Removes cookie
 * @param {string} name - cookie to be removed
 * @param {dw.system.Response} resp - response object
 */
function removeCookie(name, resp) {
    var cookies = request.getHttpCookies();
    var cookieCount = cookies.getCookieCount();
    for (var i = 0; i < cookieCount; i++) {
        if (name === cookies[i].getName()) {
            var cookie = cookies[i];
            cookie.value = '';
            cookie.setMaxAge(0);
            cookie.setPath('/');
            resp.addHttpCookie(cookie);
            break;
        }
    }
}

module.exports = {
    validateContext: validateContext,
    setCookiesToResponse: setCookiesToResponse,
    getCookie: getCookie,
    removeCookie: removeCookie
};
