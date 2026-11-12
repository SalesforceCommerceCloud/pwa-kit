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

/**
 * Builds a guest order lookup verification URL.
 *
 * @param {string} host - Validated storefront hostname (no protocol, no trailing slash)
 * @param {string} siteId - Lowercase site ID
 * @param {string} locale - BCP 47 locale string (e.g. "en-US")
 * @param {string} orderNo - Order number
 * @param {string} token - One-time access code
 * @returns {string} Full verification URL
 */
function buildOrderLookupUrl(host, siteId, locale, orderNo, token) {
    // The access code is intentionally included as a query param so customers can click
    // directly through without manually entering it. The code alone is not sufficient to
    // access an order — it must be paired with a matching email address, which is never
    // present in this URL. The code is also displayed inline in the email body as a fallback.
    return 'https://' + host + '/' + siteId + '/' + locale + '/order-lookup/verify/' + orderNo + '?token=' + encodeURIComponent(token);
}

module.exports = buildOrderLookupUrl;
