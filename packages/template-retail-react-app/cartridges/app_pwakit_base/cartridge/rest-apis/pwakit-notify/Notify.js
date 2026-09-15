/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var RESTResponseMgr = require('dw/system/RESTResponseMgr');
var Resource = require('dw/web/Resource');
var System = require('dw/system/System');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var resolveStorefrontHost = require('*/cartridge/scripts/helpers/storefrontHostProvider');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');


/**
 * Returns true when the pwakitNotify feature is enabled.
 *
 * Reads the `pwakitNotifyEnabled` global preference. Defaults to enabled when
 * the preference is unset (null) — only an explicit false disables it.
 *
 * To disable: Business Manager > Administration > Global Preferences >
 * Custom Preferences > pwakit > Notifications Enabled → false.
 * Do this if you have customized email delivery (e.g. Marketing Cloud, a
 * third-party provider, or your own hook) and don't want the cartridge's
 * default ISML-based emails to fire.
 *
 * @returns {boolean}
 */
function isNotifyEnabled() {
    try {
        var val = System.getPreferences().getCustom()['pwakitNotifyEnabled'];
        return val !== false; // null (unset) → enabled; explicit false → disabled
    } catch (e) {
        return true; // preference schema not imported yet — default to enabled
    }
}

/**
 * SCAPI Custom API handler for PWA Kit Notify.
 *
 * Authentication and scope enforcement (ShopperToken + c_pwakit_notify) are
 * handled by the SCAPI gateway before this function is called.
 *
 * Customize the if/else branches below to add, remove, or rename notification types.
 * Each branch maps a type string to a subject line and an ISML template path.
 */
exports.notify = function () {
    if (!isNotifyEnabled()) {
        RESTResponseMgr.createError(
            503,
            'notifications-disabled',
            'Service Unavailable',
            'Notifications are disabled on this instance (pwakitNotifyEnabled = false)'
        ).render();
        return;
    }
    var sendNotificationHelper = require('*/cartridge/scripts/helpers/sendNotification');

    var bodyString = request.httpParameterMap.requestBodyAsString;
    var body;
    try {
        body = JSON.parse(bodyString);
    } catch (e) {
        RESTResponseMgr.createError(400, 'invalid-json', 'Bad Request', 'Request body is not valid JSON').render();
        return;
    }

    var type = body.type;
    var recipient = body.recipient;

    if (!type || !recipient) {
        RESTResponseMgr.createError(
            400,
            'missing-required-fields',
            'Bad Request',
            'Missing required fields: type, recipient'
        ).render();
        return;
    }

    if (!body.data || typeof body.data !== 'object') {
        RESTResponseMgr.createError(400, 'missing-data', 'Bad Request', 'Missing required field: data').render();
        return;
    }

    if (!/^[^\r\n@]+@[^\r\n]+$/.test(recipient)) {
        RESTResponseMgr.createError(
            400,
            'invalid-recipient',
            'Bad Request',
            'Invalid recipient email address'
        ).render();
        return;
    }

    var storefrontHost = resolveStorefrontHost(body.host || null);
    if (storefrontHost === null) {
        RESTResponseMgr.createError(
            400,
            'invalid-host',
            'Bad Request',
            'Supplied host is not in the pwakitStorefrontHosts allowed-hosts list'
        ).render();
        return;
    }

    var subject;
    var templateName;
    var context;
    var magicLink; // set for magic-link types; returned in the success response

    if (type === 'passwordless-magic-link') {
        if (!body.data.magicLinkPath) {
            RESTResponseMgr.createError(
                400,
                'missing-magic-link-path',
                'Bad Request',
                'Missing data.magicLinkPath for passwordless-magic-link type'
            ).render();
            return;
        }
        magicLink = 'https://' + storefrontHost + body.data.magicLinkPath;
        // Extract the token from the magicLinkPath for inline display in the email
        var tokenMatch = body.data.magicLinkPath.match(/[?&]token=([^&]+)/);
        var inlineAccessCode = null;
        if (tokenMatch) {
            try {
                inlineAccessCode = decodeURIComponent(tokenMatch[1]);
            } catch (e) {
                inlineAccessCode = tokenMatch[1];
            }
        }
        subject = Resource.msg('passwordlessLogin.subject', 'email', 'Your Magic Sign-In Link');
        templateName = 'email/passwordlessLogin';
        context = { magicLink: magicLink, accessCode: inlineAccessCode };
    } else if (type === 'password-reset') {
        if (!body.data.magicLinkPath) {
            RESTResponseMgr.createError(
                400,
                'missing-magic-link-path',
                'Bad Request',
                'Missing data.magicLinkPath for password-reset type'
            ).render();
            return;
        }
        magicLink = 'https://' + storefrontHost + body.data.magicLinkPath;
        subject = Resource.msg('passwordReset.subject', 'email', 'Reset Your Password');
        templateName = 'email/passwordReset';
        context = { magicLink: magicLink };
    } else if (type === 'otp') {
        if (!body.data.token) {
            RESTResponseMgr.createError(
                400,
                'missing-token',
                'Bad Request',
                'Missing data.token for otp type'
            ).render();
            return;
        }
        subject = Resource.msg('registrationVerification.subject', 'email', 'Your Verification Code');
        templateName = 'email/registrationVerification';
        context = { token: body.data.token };
    } else if (type === 'glo-access-code') {
        if (!body.data.orderNo || !body.data.accessCode) {
            RESTResponseMgr.createError(
                400,
                'missing-fields',
                'Bad Request',
                'Missing data.orderNo or data.accessCode for glo-access-code type'
            ).render();
            return;
        }
        var siteId = Site.getCurrent().ID.toLowerCase();
        var locale = (request.locale || Site.getCurrent().defaultLocale || 'en_US').replace(/_/g, '-');
        var lookupLink = 'https://' + storefrontHost + '/' + siteId + '/' + locale + '/order-lookup/verify/' + body.data.orderNo + '?token=' + encodeURIComponent(body.data.accessCode);
        subject = Resource.msg('guestOrderLookup.subject', 'email', 'Your Order Access Code');
        templateName = 'email/guestOrderLookup';
        context = { orderNo: body.data.orderNo, accessCode: body.data.accessCode, lookupLink: lookupLink };
    } else {
        RESTResponseMgr.createError(
            400,
            'unknown-notification-type',
            'Bad Request',
            'Unknown notification type'
        ).render();
        return;
    }

    var result = sendNotificationHelper.send(recipient, subject, templateName, context);

    if (result.error) {
        RESTResponseMgr.createError(
            500,
            'notification-delivery-failed',
            'Internal Server Error',
            result.errorMessage || 'Notification delivery failed'
        ).render();
        return;
    }

    var successBody = { success: true };
    if (magicLink) {
        successBody.data = { magicLink: magicLink };
    }
    RESTResponseMgr.createSuccess(successBody).render();
};

exports.notify.public = true;
