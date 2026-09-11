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

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var System = require('dw/system/System');
var Site = require('dw/system/Site');
var HookMgr = require('dw/system/HookMgr');
var sendNotification = require('*/cartridge/scripts/helpers/sendNotification');
var resolveStorefrontHost = require('*/cartridge/scripts/helpers/storefrontHostProvider');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');

log.info('sendOrderAccessCode module loaded');


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
 * Hook implementation for sfcc.app.order.sendOrderAccessCode.
 *
 * Called by SCAPI's requestOrderAccessCode with the B2C Order object and the
 * generated access code. Signature is (order, accessCode) per the platform
 * hook contract — not (recipient, orderNo, accessCode).
 *
 * @param {dw.order.Order} order - The B2C Order object
 * @param {string} accessCode - The one-time access code
 * @returns {dw.system.Status}
 */
function sendOrderAccessCode(order, accessCode) {
    if (!isNotifyEnabled()) {
        log.info('sendOrderAccessCode: pwakitNotifyEnabled is false — skipping (custom email provider in use)');
        var skipped = HookMgr.callNextHook('sfcc.app.order.sendOrderAccessCode', 'sendOrderAccessCode', order, accessCode);
        return skipped || new Status(Status.OK);
    }
    log.info('sendOrderAccessCode called: orderNo={0}', order ? order.orderNo : 'null');
    if (!order || !order.customerInfo) {
        log.error('sendOrderAccessCode: order or customerInfo is null');
        return new Status(Status.ERROR, 'NULL_ORDER', 'Order or customer info is null');
    }

    var siteId = Site.getCurrent().ID.toLowerCase();
    var locale = (request.locale || Site.getCurrent().defaultLocale || 'en_US').replace(/_/g, '-');
    var magicLink = 'https://' + resolveStorefrontHost(null) + '/' + siteId + '/' + locale + '/order-lookup/verify/' + order.orderNo + '?token=' + encodeURIComponent(accessCode);

    var result = sendNotification.send(
        order.customerInfo.email,
        Resource.msg('gloAccessCode.subject', 'email', 'Your Order Access Code'),
        'email/gloAccessCode',
        { orderNo: order.orderNo, accessCode: accessCode, magicLink: magicLink }
    );

    if (result.error) {
        return new Status(Status.ERROR, 'MAIL_FAILED', result.errorMessage || 'mail.send() failed');
    }

    var next = HookMgr.callNextHook('sfcc.app.order.sendOrderAccessCode', 'sendOrderAccessCode', order, accessCode);
    return next || new Status(Status.OK);
}

module.exports = { sendOrderAccessCode: sendOrderAccessCode };
