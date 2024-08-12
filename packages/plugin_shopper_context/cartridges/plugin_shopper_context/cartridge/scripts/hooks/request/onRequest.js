'use strict';

/* global request, response, session */
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var {
    getCookie,
    setCookiesToResponse
} = require('*/cartridge/scripts/helpers/utils');
var Fetch = require('*/cartridge/scripts/services/fetch');

var slasAuthHelper = require('*/cartridge/scripts/helpers/slasAuthHelper');
var slasAuthService = require('*/cartridge/scripts/services/SLASAuthService');
if (!slasAuthHelper || !slasAuthHelper) {
    throw new Error('Please include plugin_slas');
}
var config = require('*/cartridge/scripts/config/SLASConfig');
var currentSite = Site.getCurrent();

var CONTEXT_CHECK_COOKIE_AGE = 30 * 60;
var { SHORT_CODE, ORGID } = require('*/cartridge/scripts/config/constant');
var GET_SERVICE = 'plugin_shopper_context.generic.get';
var SHOPPER_CONTEXT = 'shopper_context_RefArch';

function isContextGuardActive() {
    var isShopperContextChecked = getCookie(SHOPPER_CONTEXT);
    // var contextGuardCookie = getCookie(CONTEXT_GUARD_COOKIE_NAME);
    var hasContextSet =
        isShopperContextChecked && isShopperContextChecked.value === '0';
    // removeCookie(CONTEXT_GUARD_COOKIE_NAME, response);
    return hasContextSet;
}
/**
 * Returns the base URL
 * @returns {string} url - the url for this instance
 */
function getBaseURL() {
    return (
        'https://' +
        SHORT_CODE +
        '.api.commercecloud.salesforce.com/shopper/shopper-context/v1/organizations/' +
        ORGID
    );
}

function getShopperContext(usid, token, siteId) {
    if (!token || !usid) {
        throw new Error('No usid or token is found.');
    }
    var shopperContextUrl = getBaseURL() + '/shopper-context/' + usid;
    var fetchOptions = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token
        },
        queryParameters: {
            siteId: siteId
        }
    };
    var res = Fetch.fetch(GET_SERVICE, shopperContextUrl, fetchOptions);
    // 400 means no context is found, we do nothing.
    if (res.status === 400) {
        return;
    }
    if (!res.ok) {
        Fetch.throwHttpError(res, 'getShopperContext error');
    }

    return JSON.parse(res.body);
}

exports.onRequest = function () {
    var dwsid = getCookie('dwsid');
    // wait until session is bridge before starting to bridge shopper context
    if (!dwsid) return;
    var isShopperContextChecked = getCookie(SHOPPER_CONTEXT);
    // clear out any context if there is no context detected
    if (!isShopperContextChecked) {
        session.setSourceCode(null);
        return new Status(Status.OK);
    }

    if (isContextGuardActive()) {
        return new Status(Status.OK);
    }
    var cookiesToSet = {};
    var tokenData = {};
    var guestRefreshTokenCookie = slasAuthHelper.getCookie(
        config.REFRESH_TOKEN_COOKIE_NAME_GUEST
    );
    var registeredRefreshTokenCookie = slasAuthHelper.getCookie(
        config.REFRESH_TOKEN_COOKIE_NAME_REGISTERED
    );

    var isNewGuestShopper =
        !guestRefreshTokenCookie && !registeredRefreshTokenCookie;
    if (isNewGuestShopper) {
        if (config.USE_DWGST) {
            tokenData = slasAuthHelper.getSLASAccessTokenForGuestSessionBridge(
                session.generateGuestSessionSignature()
            );
        } else {
            tokenData = slasAuthHelper.getSLASAccessTokenForGuestSessionBridge(
                request.httpHeaders.get('x-is-session_id')
            );
        }
    } else {
        tokenData = slasAuthService.getAccessToken({
            grant_type: config.GRANT_TYPE_REFRESH_TOKEN,
            refresh_token: registeredRefreshTokenCookie
                ? registeredRefreshTokenCookie.value
                : guestRefreshTokenCookie.value
        });
    }
    var refreshTokenCookieToSet = registeredRefreshTokenCookie
        ? config.REFRESH_TOKEN_COOKIE_NAME_REGISTERED
        : config.REFRESH_TOKEN_COOKIE_NAME_GUEST;
    cookiesToSet[refreshTokenCookieToSet] = {
        value: tokenData.refresh_token,
        maxAge: tokenData.refresh_token_expires_in
    };

    var usidCookieName = 'usid_' + currentSite.ID;
    var usid = getCookie(usidCookieName);

    if (tokenData.access_token) {
        var context = getShopperContext(
            usid.value,
            tokenData.access_token,
            currentSite.ID
        );
        if (context) {
            session.setSourceCode(context.sourceCode);
        }
        cookiesToSet[SHOPPER_CONTEXT] = {
            value: 0,
            maxAge: CONTEXT_CHECK_COOKIE_AGE
        };
        setCookiesToResponse(cookiesToSet, response);
    }

    return new Status(Status.OK);
};
