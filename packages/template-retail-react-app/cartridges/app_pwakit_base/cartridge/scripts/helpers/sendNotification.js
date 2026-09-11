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

var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');

/**
 * Renders an ISML template to a string for use as a notification body.
 *
 * @param {string} templateName - Path to the ISML template (without .isml extension)
 * @param {Object} templateContext - Key/value pairs to expose in the template
 * @returns {string} Rendered HTML string
 */
function renderTemplate(templateName, templateContext) {
    var template = new Template(templateName);
    var map = new HashMap();
    var keys = Object.keys(templateContext);
    for (var i = 0; i < keys.length; i++) {
        map.put(keys[i], templateContext[keys[i]]);
    }
    return template.render(map).text;
}

/**
 * Returns a minimal plain-text fallback for the given notification type and context.
 * Screen readers and plain-mail clients need this; spam filters score multipart higher.
 */
function buildPlainText(templateName, context) {
    if (context.magicLink) {
        return Resource.msg('email.plaintext.useThisLink', 'email', 'Use this link to continue:') + '\n' + context.magicLink;
    }
    if (context.token) {
        return Resource.msg('email.plaintext.verificationCode', 'email', 'Your verification code:') + ' ' + context.token;
    }
    if (context.accessCode) {
        return Resource.msg('email.plaintext.orderAccessCode', 'email', 'Your order access code:') + ' ' + context.accessCode
            + '\n' + Resource.msg('email.plaintext.orderNumber', 'email', 'Order:') + ' ' + (context.orderNo || '');
    }
    return '';
}

/**
 * Sends a transactional notification.
 *
 * // Customize this function to integrate your preferred delivery service.
 * // The default implementation renders an ISML template and delivers via
 * // B2C Commerce's built-in mail API (dw/net/Mail).
 * // To use a third-party provider (e.g. SendGrid, Mailchimp, Postmark, SMS gateway),
 * // replace the renderTemplate call and the dw/net/Mail logic below with
 * // your provider's SDK or an HTTP service call.
 *
 * @param {string} recipient - Recipient address
 * @param {string} subject - Notification subject line
 * @param {string} templateName - Path to the ISML template (relative to templates/default/)
 * @param {Object} context - Template context variables
 * @returns {{ error: boolean, errorMessage?: string }}
 */
function send(recipient, subject, templateName, context) {
    try {
        var site = Site.getCurrent();
        var senderEmail = site.getCustomPreferenceValue('customerServiceEmail')
            || 'no-reply@' + site.httpsHostName;

        log.info('Sending notification: template={0}, subject={1}, from={2}', templateName, subject, senderEmail);

        var localeRaw = request.locale || site.defaultLocale || 'en';
        var localeId = String(localeRaw).replace(/_/g, '-');
        var ctx = context || {};
        var templateContext = { localeId: localeId, emailTitle: subject };
        var ctxKeys = Object.keys(ctx);
        for (var k = 0; k < ctxKeys.length; k++) {
            templateContext[ctxKeys[k]] = ctx[ctxKeys[k]];
        }
        var htmlBody = renderTemplate(templateName, templateContext);
        var plainBody = buildPlainText(templateName, context || {});

        var mail = new Mail();
        mail.addTo(recipient);
        mail.setFrom(senderEmail);
        mail.setSubject(subject);
        mail.setContent(htmlBody, 'text/html', 'UTF-8');

        var status = mail.send();
        if (status.isError()) {
            log.error('mail.send() failed: template={0}, subject={1}', templateName, subject);
            return { error: true, errorMessage: 'Mail.send() returned error status' };
        }

        log.info('mail.send() succeeded: template={0}', templateName);
        return { error: false };
    } catch (e) {
        log.error('mail.send() threw: template={0}, error={1}', templateName, e.message);
        return { error: true, errorMessage: 'Notification delivery failed: ' + e.message };
    }
}

module.exports = { send: send };
