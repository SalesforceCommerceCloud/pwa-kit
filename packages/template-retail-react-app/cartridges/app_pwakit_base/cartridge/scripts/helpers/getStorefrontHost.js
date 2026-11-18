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

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');

/**
 * Returns the public-facing hostname for the current storefront site.
 *
 * Resolution order:
 * 1. (Future) Site.getCurrent().mrtExternalHostname — platform-provided eCDN hostname.
 *    Uncomment the lines below when this API becomes available.
 * 2. pwakitStorefrontHost site preference — configure per-site in Business Manager:
 *    Merchant Tools > Custom Preferences > pwakit > Storefront Host.
 *
 * Returns null when no host can be resolved. Callers should treat null as a
 * configuration gap and omit lookup-link CTAs from the email.
 *
 * @returns {string|null} Hostname without protocol or trailing slash, or null if unresolvable.
 */
function getStorefrontHost() {
    // Future: return the platform-provided eCDN hostname when available.
    // var mrtHost = Site.getCurrent().mrtExternalHostname;
    // if (mrtHost) return mrtHost.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
        var host = Site.getCurrent().getCustomPreferenceValue('pwakitStorefrontHost');
        if (host && host.trim()) {
            return host.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        }
    } catch (e) {
        log.warn('getStorefrontHost: could not read pwakitStorefrontHost preference: {0}', e.message);
    }

    log.warn(
        'getStorefrontHost: pwakitStorefrontHost is not configured for site "{0}". ' +
            'Set it in Business Manager > Merchant Tools > Custom Preferences > pwakit.',
        Site.getCurrent().ID
    );
    return null;
}

module.exports = getStorefrontHost;
