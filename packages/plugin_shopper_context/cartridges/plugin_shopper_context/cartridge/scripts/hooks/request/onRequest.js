'use strict';

/* global request, response, session */
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var {
    getCookie,
    removeCookie,
    setCookiesToResponse
} = require('*/cartridge/scripts/helpers/utils');
var Fetch = require('*/cartridge/scripts/services/fetch');

var currentSite = Site.getCurrent();
var multiSiteSupportEnabled =
    currentSite.getCustomPreferenceValue('supportMultiSite');

var CONTEXT_CHECK_COOKIE_AGE = 30 * 60;
var CONTEXT_GUARD_COOKIE_NAME = 'cc-context-guard';
var ACCESS_TOKEN_COOKIE_NAME = multiSiteSupportEnabled
    ? 'cc-at_' + currentSite.ID
    : 'cc-at';
var ACCESS_TOKEN_COOKIE_NAME_2 = ACCESS_TOKEN_COOKIE_NAME + '_2';
var { SHORT_CODE, ORGID } = require('*/cartridge/scripts/config/constant');
var GET_SERVICE = 'plugin_shopper_context.generic.get';

function isContextGuardActive() {
    var contextGuardCookie = getCookie(CONTEXT_GUARD_COOKIE_NAME);
    var activeContextGuard =
        contextGuardCookie && contextGuardCookie.maxAge < 30 * 60;
    removeCookie(CONTEXT_GUARD_COOKIE_NAME, response);
    return activeContextGuard;
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
    if (isContextGuardActive()) {
        return new Status(Status.OK);
    }
    var cookiesToSet = {};
    var token_part_1 = getCookie(ACCESS_TOKEN_COOKIE_NAME);
    var token_part_2 = getCookie(ACCESS_TOKEN_COOKIE_NAME_2);
    var token = '';
    var usidCookieName = 'usid_' + currentSite.ID;
    var usid = getCookie(usidCookieName);
    if (token_part_1 && token_part_2) {
        token = token_part_1.value + token_part_2.value;
    }

    if (token) {
        var context = getShopperContext(usid.value, token, currentSite.ID);
        if (context) {
            session.setSourceCode(context.sourceCode);
        }
        cookiesToSet[CONTEXT_GUARD_COOKIE_NAME] = {
            value: 1,
            maxAge: CONTEXT_CHECK_COOKIE_AGE
        };
        setCookiesToResponse(cookiesToSet, response);
    }

    return new Status(Status.OK);
};
