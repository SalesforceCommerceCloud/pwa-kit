'use strict';

/* global request, response, session */
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
const {
    getCookie,
    removeCookie,
    setCookiesToResponse
} = require('*/cartridge/scripts/helpers/utils');

var currentSite = Site.getCurrent();
var multiSiteSupportEnabled =
    currentSite.getCustomPreferenceValue('supportMultiSite');

var CONTEXT_CHECK_COOKIE_AGE = 30 * 60;
var CONTEXT_GUARD_COOKIE_NAME = 'cc-context-guard';
var ACCESS_TOKEN_COOKIE_NAME = multiSiteSupportEnabled
    ? 'cc-at_' + currentSite.ID
    : 'cc-at';
var ACCESS_TOKEN_COOKIE_NAME_2 = ACCESS_TOKEN_COOKIE_NAME + '_2';

function isContextGuardActive() {
    var contextGuardCookie = getCookie(CONTEXT_GUARD_COOKIE_NAME);
    var activeContextGuard =
        contextGuardCookie && contextGuardCookie.maxAge < 30 * 60;
    removeCookie(CONTEXT_GUARD_COOKIE_NAME, response);
    return activeContextGuard;
}

exports.onRequest = function () {
    if (isContextGuardActive()) {
        return new Status(Status.OK);
    }
    var cookies = request.getHttpCookies();
    var cookieName = 'shopper_context_' + currentSite.ID;
    var shopperContexCookie = cookies['shopper_context_RefArch'];
    var cookiesToSet = {};
    var token_part_1 = getCookie(ACCESS_TOKEN_COOKIE_NAME);
    var token_part_2 = getCookie(ACCESS_TOKEN_COOKIE_NAME_2);
    var token = '';
    if (token_part_1 && token_part_2) {
        token = token_part_1.value + token_part_2.value;
    }

    if (token) {
        cookiesToSet[CONTEXT_GUARD_COOKIE_NAME] = {
            value: 1,
            maxAge: CONTEXT_CHECK_COOKIE_AGE
        };
        var test = cookiesToSet;

        setCookiesToResponse(cookiesToSet, response);
    }


    return new Status(Status.OK);
};
