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
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('pwakit-notify', 'pwakit-notify');

/**
 * Resolves the public storefront hostname for magic-link URL construction.
 *
 * Validates a caller-supplied hostname against the comma-separated
 * `pwakitStorefrontHosts` global preference allowlist. When no callerHost is
 * provided, returns the first configured host.
 *
 * Returns null when:
 * - callerHost is provided but not in the allowlist (including when the allowlist is empty)
 * - callerHost is not provided and the allowlist is empty or unset
 *
 * Callers treat a null return as "no host available" — magic-link CTA buttons
 * are omitted from the email but the email is still sent (e.g. with an inline
 * access code). Templates must guard all magic-link usage with
 * <isif condition="${!empty(pdict.magicLink)}"> / lookupLink equivalent.
 *
 * @param {string|null} callerHost Hostname supplied by the API caller (no protocol,
 *   no trailing slash). Pass null when calling from a server-side hook that has no
 *   incoming host to validate (e.g. sendOrderAccessCode).
 * @returns {string|null} Validated hostname, or null if unresolvable.
 */
function resolveStorefrontHost(callerHost) {
    var allowedHosts = getAllowedHosts();

    if (callerHost && callerHost.trim()) {
        var normalizedHost = callerHost.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (allowedHosts.indexOf(normalizedHost.toLowerCase()) !== -1) {
            return normalizedHost.toLowerCase();
        }
        log.warn(
            'storefrontHostProvider: caller-supplied host "{0}" is not in the pwakitStorefrontHosts allowlist — email sent without magic link.',
            normalizedHost
        );
        return null;
    }

    if (allowedHosts.length > 0) {
        return allowedHosts[0];
    }

    log.warn(
        'storefrontHostProvider: no callerHost provided and pwakitStorefrontHosts is not configured — email sent without magic link. ' +
            'Configure pwakitStorefrontHosts in Business Manager > Global Preferences > Custom Preferences > pwakit.'
    );
    return null;
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
