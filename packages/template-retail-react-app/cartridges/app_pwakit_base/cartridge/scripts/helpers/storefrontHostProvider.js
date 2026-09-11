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

var System = require('dw/system/System');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');

/**
 * Resolves the public storefront hostname for magic-link URL construction.
 *
 * Current implementation: validates a caller-supplied hostname against the
 * comma-separated `pwakitStorefrontHosts` global preference allowlist, then
 * falls back to the first configured host, then to the B2C instance hostname.
 *
 * TODO: replace this module body with a single Script API call once B2C exposes
 * the MRT/eCDN hostname natively, e.g.:
 *
 *   var ComposableStorefrontMgr = require('dw/mrt/ComposableStorefrontMgr');
 *   module.exports = function resolveStorefrontHost() {
 *       return ComposableStorefrontMgr.getStorefrontHostname(Site.getCurrent().getID())
 *           || Site.getCurrent().httpsHostName;
 *   };
 *
 * The export signature (requestedHost: string|null) → string|null is intentionally
 * preserved so callers require no changes after the swap. The future implementation
 * ignores `requestedHost` and the null return path becomes unreachable.
 *
 * @param {string|null} requestedHost Hostname supplied by the API caller (no protocol,
 *   no trailing slash). Pass null when calling from a server-side hook that has no
 *   incoming host to validate (e.g. sendOrderAccessCode).
 * @returns {string|null} Validated hostname to use in magic-link URLs, or null when
 *   requestedHost was supplied but is not in the allowlist (caller should reject with 400).
 */
function resolveStorefrontHost(requestedHost) {
    var allowedHosts = getAllowedHosts();

    if (requestedHost && requestedHost.trim()) {
        var normalizedHost = requestedHost.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (allowedHosts.length === 0) {
            log.warn(
                'pwakitStorefrontHosts allowlist is not configured. Accepting host from request ({0}). ' +
                    'Configure pwakitStorefrontHosts in Business Manager to restrict allowed hosts.',
                normalizedHost
            );
            return normalizedHost;
        }
        if (allowedHosts.indexOf(normalizedHost) !== -1) {
            return normalizedHost;
        }
        log.error(
            'Rejecting magic-link request: host "{0}" is not in the pwakitStorefrontHosts allowlist ({1})',
            normalizedHost,
            allowedHosts.join(', ')
        );
        return null;
    }

    if (allowedHosts.length > 0) {
        return allowedHosts[0];
    }

    log.warn(
        'pwakitStorefrontHosts is not configured. Magic-link emails will use the B2C instance hostname ({0}), ' +
            'which is incorrect for headless storefronts.',
        Site.getCurrent().httpsHostName
    );
    return Site.getCurrent().httpsHostName;
}

function getAllowedHosts() {
    try {
        var pref = System.getPreferences().getCustom()['pwakitStorefrontHosts'];
        if (!pref || !pref.trim()) return [];
        return pref.split(',').map(function(h) { return h.trim(); }).filter(Boolean);
    } catch (e) {
        return [];
    }
}

module.exports = resolveStorefrontHost;
