/*
 * TEMP WORKAROUND: Patch global fetch before any other module captures a reference.
 * Cloudflare WAF on sandbox-001.api.commercecloud.salesforce.com blocks direct
 * server-side SCAPI calls from MRT IPs (rule 79593db394af4793afc33c4cf753fd2d).
 * This reroutes them through the CDN proxy (/mobify/proxy/api).
 *
 * Remove once IPA team adds a custom Cloudflare rule for our realm (zysn).
 * See: https://salesforce-internal.slack.com/archives/C02B15LQ4MR/p1751924337113869
 */

const SCAPI_HOST = 'sandbox-001.api.commercecloud.salesforce.com'
const APP_ORIGIN = process.env.APP_ORIGIN

if (APP_ORIGIN && typeof globalThis.fetch === 'function') {
    const _originalFetch = globalThis.fetch.bind(globalThis)
    globalThis.fetch = function (input, init) {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input?.url || ''
        if (url.includes(SCAPI_HOST)) {
            const parsed = new URL(url)
            const proxied = `${APP_ORIGIN}/mobify/proxy/api${parsed.pathname}${parsed.search}`
            return _originalFetch(proxied, init)
        }
        return _originalFetch(input, init)
    }
}
