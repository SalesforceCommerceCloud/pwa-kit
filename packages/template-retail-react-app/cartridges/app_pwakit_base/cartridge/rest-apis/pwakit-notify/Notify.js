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
var Logger = require('dw/system/Logger');
var CustomerMgr = require('dw/customer/CustomerMgr');
var getStorefrontHost = require('*/cartridge/scripts/helpers/getStorefrontHost');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');

function renderHostNotConfigured() {
    RESTResponseMgr.createError(
        503,
        'host-not-configured',
        'Service Unavailable',
        'pwakitStorefrontHost is not configured for this site'
    ).render();
}

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

    var subject;
    var templateName;
    var context;
    var magicLink; // set for magic-link types; returned in the success response

    if (type === 'passwordless-magic-link') {
        // Passwordless login requires a pre-existing registered account. Succeed
        // silently for unrecognised addresses — this prevents email enumeration
        // while avoiding delivery to non-existent accounts.
        var plCustomer = CustomerMgr.getCustomerByLogin(recipient);
        if (!plCustomer || !plCustomer.registered) {
            log.debug('passwordless-magic-link: no registered customer found for recipient — skipping send');
            RESTResponseMgr.createSuccess({success: true}).render();
            return;
        }
        if (!body.data.magicLinkPath) {
            RESTResponseMgr.createError(
                400,
                'missing-magic-link-path',
                'Bad Request',
                'Missing data.magicLinkPath for passwordless-magic-link type'
            ).render();
            return;
        }
        var plHost = getStorefrontHost();
        if (!plHost) {
            renderHostNotConfigured();
            return;
        }
        magicLink = 'https://' + plHost + body.data.magicLinkPath;
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
        // Password reset requires a pre-existing registered account. Succeed
        // silently for unrecognised addresses — this prevents email enumeration
        // while avoiding delivery to non-existent accounts.
        var prCustomer = CustomerMgr.getCustomerByLogin(recipient);
        if (!prCustomer || !prCustomer.registered) {
            log.debug('password-reset: no registered customer found for recipient — skipping send');
            RESTResponseMgr.createSuccess({success: true}).render();
            return;
        }
        if (!body.data.magicLinkPath) {
            RESTResponseMgr.createError(
                400,
                'missing-magic-link-path',
                'Bad Request',
                'Missing data.magicLinkPath for password-reset type'
            ).render();
            return;
        }
        var prHost = getStorefrontHost();
        if (!prHost) {
            renderHostNotConfigured();
            return;
        }
        magicLink = 'https://' + prHost + body.data.magicLinkPath;
        subject = Resource.msg('passwordReset.subject', 'email', 'Reset Your Password');
        templateName = 'email/passwordReset';
        context = { magicLink: magicLink };
    } else if (type === 'otp') {
        // Used by the account registration / email verification flow. The `token`
        // field is a short 6-8 digit SLAS TOTP (not a JWT).
        //
        // SLAS creates the B2C customer profile at authorize time, before this
        // callback fires. Requiring the profile to exist in CustomerMgr prevents
        // a crafted payload from sending verification emails to arbitrary addresses.
        // We do not check verified/unverified state — that is managed by SLAS and
        // is not reliably exposed through the B2C scripting API.
        var otpCustomer = CustomerMgr.getCustomerByLogin(recipient);
        if (!otpCustomer || !otpCustomer.registered) {
            log.debug('otp: no registered customer found for recipient — skipping send');
            RESTResponseMgr.createSuccess({success: true}).render();
            return;
        }
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
