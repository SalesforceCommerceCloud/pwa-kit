/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/ssr-proxy-utils
 */
/*
 There are some special requirements for this module, which is used in the
 SDK and also in Lambda@Edge functions run by CloudFront. Specifically:
 - Don't add any functionality in here that is not required by the
   proxying code.
 - Avoid importing any other modules not explicitly used by this code
 */

import {parse as parseSetCookie} from 'set-cookie-parser'
import headerCase from 'header-case'
import {URL} from 'url'

const AC_ALLOW_ORIGIN = 'access-control-allow-origin'
const HOST = 'host'
const LOCATION = 'location'
const ORIGIN = 'origin'
const SET_COOKIE = 'set-cookie'
const USER_AGENT = 'user-agent'

const HEADER_FORMATS = ['http', 'aws']
export const X_PROXY_REQUEST_URL = 'x-proxy-request-url'
export const X_MOBIFY_REQUEST_CLASS = 'x-mobify-request-class'
export const MAX_URL_LENGTH_BYTES = 8192

/**
 * This class provides a representation of HTTP request or response
 * headers, that operates in the same way in multiple contexts
 * (i.e. within the SSR Server as well as the request-processor).
 *
 * Within a Headers instance, headers are referenced using lower-case
 * names. Use getHeader to access the value for a header. If there
 * are multiple values, this will return the first value. This class
 * internally supports round-trip preservation of multi-value headers,
 * but does not yet provide a way to access them.
 */
export class Headers {
    /*
     A Lambda@Edge event contains headers in this form:
     "headers": {
        "host": [
            {
                "key": "Host",
                "value": "d111111abcdef8.cloudfront.net"
            }
        ],
        "user-agent": [
            {
                "key": "User-Agent",
                "value": "curl/7.18.1"
            }
        ]
     }

     The http.IncomingMessage format is a simple object:
     {
        'user-agent': 'curl/7.22.0',
        host: '127.0.0.1:8000'
     }

     However, for IncomingMessage:
     Duplicates of age, authorization, content-length, content-type, etag,
      expires, from, host, if-modified-since, if-unmodified-since,
      last-modified, location, max-forwards, proxy-authorization, referer,
      retry-after, or user-agent are discarded.
     The value for set-cookie is always an array. Duplicates are added to the array.
     For all other headers, the values are joined together with ','

     */

    /**
     * Construct a Headers object from either an AWS Lambda Event headers
     * object, or an http.IncomingMessage headers object.
     *
     * Project code should never need to call this constructor.
     *
     * @private
     * @param headers {Object} the input headers
     * @param format {String} either 'http' or 'aws'
     */
    constructor(headers, format) {
        if (!HEADER_FORMATS.includes(format)) {
            throw new Error(`Headers format must be one of ${HEADER_FORMATS.join(', ')}`)
        }
        this.httpFormat = format === 'http'

        // Within this class, headers are represented by an object that maps
        // header names (lower-case) to arrays of values.
        this.headers = {}

        for (const [key, values] of Object.entries(headers)) {
            // For http format, the value will be a comma-separated
            // list of values (https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2)
            // For AWS format, the value is an array of key/value objects.
            if (this.httpFormat) {
                // The Set-Cookie header is always passed to us as an array,
                // so we do not split.
                if (key === SET_COOKIE) {
                    this.headers[key] = values.slice()
                } else {
                    this.headers[key] = values.split(/,\s*/).map((value) => value.trim())
                }
            } else {
                this.headers[key] = values.map((value) => value.value.trim())
            }
        }

        this._modified = false
    }

    /**
     * Return true if and only if any set or delete methods were called on
     * this instance after construction. This does not actually test if
     * the headers values have been changed, just whether any mutating
     * methods have been called.
     * @returns {Boolean}
     */
    get modified() {
        return this._modified
    }

    /**
     * Return an array of the header keys (all lower-case)
     */
    keys() {
        return Object.keys(this.headers)
    }

    /**
     * Get the value of the set-cookie header(s), returning an array
     * of strings. Always returns an array, even if it's empty.
     */
    getSetCookie() {
        return this.headers[SET_COOKIE] || []
    }

    /**
     * Set the value of the set-cookie header(s)
     * @param values {Array<String>}
     */
    setSetCookie(values) {
        this._modified = true

        if (!(values && values.length)) {
            delete this.headers[SET_COOKIE]
            return
        }

        // Clone the array
        this.headers[SET_COOKIE] = values.slice()
    }

    /**
     * Return the FIRST value of the header with the given key.
     * This is for single-value headers only: Location, Access-Control-*, etc
     * If the header is not present, returns undefined.
     * @param key {String} header name
     */
    getHeader(key) {
        const keyLC = key.toLowerCase()
        const values = this.headers[keyLC]
        if (!values) {
            return undefined
        }
        return values[0]
    }

    /**
     * Set the value of the header with the given key. This is for single-
     * value headers only (see getHeader). Setting the value removes ALL other
     * values for the given key.
     * @param key {String} header name
     * @param value {String} header value
     */
    setHeader(key, value) {
        this._modified = true
        const keyLC = key.toLowerCase()
        this.headers[keyLC] = [value]
    }

    /**
     * Remove any header with the given key
     * @param key
     */
    deleteHeader(key) {
        this._modified = true
        const keyLC = key.toLowerCase()
        delete this.headers[keyLC]
    }

    /**
     * Return the headers in AWS (Lambda event) format.
     *
     * Project code should never need to use this method.
     */
    toAWSFormat() {
        const result = {}
        for (const [key, values] of Object.entries(this.headers)) {
            // Some customer servers return headers with unusual keys; for
            // example, 'cached_response'. Underscores are technically legal
            // in header keys, but are unexpected. The problem is that the
            // header-case package maps underscore to '-' to get "legal"
            // names, which breaks Lambda validation. So if the key
            // contains an underscore, we use it as-is.
            const finalKey = key.includes('_') ? key : headerCase(key)
            result[key] = values.map((value) => ({
                key: finalKey,
                value
            }))
        }
        return result
    }

    /**
     * Return the headers in Express (http.IncomingMessage) format.
     *
     * RFC2616 allows some flexibility in how multiple values are
     * combined into a single header value. We separate with ', '
     * rather than just ',' to maintain previous behaviour.
     *
     * Project code should never need to use this method.
     */
    toHTTPFormat() {
        const result = {}
        for (const [key, values] of Object.entries(this.headers)) {
            // The Set-Cookie header is always returned as an array
            if (key === SET_COOKIE) {
                result[key] = values.slice()
            } else {
                result[key] = values.join(', ')
            }
        }
        return result
    }

    /**
     * Return the headers in the same format (aws or http) that was
     * used to construct them.
     *
     * Project code should never need to use this method.
     */
    toObject() {
        return this.httpFormat ? this.toHTTPFormat() : this.toAWSFormat()
    }
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthAbbr = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
]

// Return the given number as a 2-digit string with a leading zero
const leadingZero = (n) => {
    const s = Number(n).toString()
    return s.length > 1 ? s : '0' + s // eslint-disable-line prefer-template
}

/**
 * Return the given date as an RFC1123-format string, suitable for
 * use in a Set-Cookie or Date header. The result is always in UTC.
 * @function
 * @param date {Date}
 * @returns {String}
 */
export const rfc1123 = (date) => {
    const time = [
        leadingZero(date.getUTCHours()),
        leadingZero(date.getUTCMinutes()),
        leadingZero(date.getUTCSeconds())
    ].join(':')
    return [
        `${dayNames[date.getUTCDay()]},`,
        leadingZero(date.getUTCDate()),
        monthAbbr[date.getUTCMonth()],
        date.getUTCFullYear(),
        time,
        'GMT'
    ].join(' ')
}

/**
 * Given a cookie object parsed by set-cookie-parser,
 * return a set-cookie header value for it.
 * @private
 */
export const cookieAsString = (cookie) => {
    const elements = [`${cookie.name}=${cookie.value}`]
    if (cookie.path) {
        elements.push(`Path=${cookie.path}`)
    }
    if (cookie.expires) {
        // This is a Date object and must be represented as
        // an HTTP-date timestamp (RFC1123 format). For example,
        // Wed, 24-Oct-2018 00:13:20 GMT
        elements.push(`Expires=${rfc1123(cookie.expires)}`)
    }
    if (cookie.domain) {
        elements.push(`Domain=${cookie.domain}`)
    }
    if (cookie.maxAge) {
        elements.push(`Max-Age=${cookie.maxAge}`)
    }
    if (cookie.secure) {
        elements.push('Secure')
    }
    if (cookie.httpOnly) {
        elements.push('HttpOnly')
    }
    if (cookie.sameSite) {
        elements.push(`SameSite=${cookie.sameSite}`)
    }
    return elements.join('; ')
}

const IPV6 = 'IPV6'
const IPV4 = 'IPV4'
const LOCALHOST = 'localhost'

/**
 * An array of {type, regexp, isIPOrLocalhost} objects, where the type is used
 * to determine how to get a port, regexp will spot an IPv4, IPv6 or hostname,
 * and the isIPOrLocalhost flag is true for IP addresses or locahost, false for
 * hostnames. The main reason for detecting IP address/localhost is to determine
 * whether it can have subdomains.
 * @private
 */
const HOST_AND_PORT_TESTS = [
    // IPV6 address plus port
    {
        type: IPV6,
        regexp: /^\[([a-fA-F0-9:]+)\]:(\d+)$/,
        isIPOrLocalhost: true,
        hasPort: true
    },
    // IPV6 address without port
    {
        type: IPV6,
        regexp: /^([a-fA-F0-9:]+)$/,
        isIPOrLocalhost: true,
        hasPort: false
    },
    // IPV4 address plus port
    {
        type: IPV4,
        regexp: /^(\d+\.\d+\.\d+\.\d+):(\d+)$/,
        isIPOrLocalhost: true,
        hasPort: true
    },
    // IPV4 address plus without port
    {
        type: IPV4,
        regexp: /^(\d+\.\d+\.\d+\.\d+)$/,
        isIPOrLocalhost: true,
        hasPort: false
    },
    // localhost plus port
    {
        type: LOCALHOST,
        regexp: /^(localhost):(\d+)$/,
        isIPOrLocalhost: true,
        hasPort: true
    },
    // localhost without port
    {
        type: LOCALHOST,
        regexp: /^(localhost)$/,
        isIPOrLocalhost: true,
        hasPort: false
    },
    // hostname plus port
    {
        type: null,
        regexp: /(.+):\d+/,
        isIPOrLocalhost: false, // False means the hostname may have a subdomain
        hasPort: true
    }
]

/**
 * @typedef {Object} ParsedHost
 * @property host {String} The host (10.10.10.10:port), which includes the port (if any)
 * @property hostname {String} The hostname (10.10.10.10), which excludes the port
 * @property port {String} The host's port
 * @property isIPOrLocalhost {Boolean} Whether the hostname is an IP or localhost
 */
/**
 * Given a hostname that may be a hostname or ip address optionally
 * followed by a port, return an object with 'host' being the ip address,
 * the hostname, a port (if there is one), and 'isIPOrLocalhost' true for an ip
 * address or localhost, false for a hostname
 * @private
 * @param host {String} Can be localhost, an IP or domain name
 * @return {ParsedHost}
 */
export const parseHost = (host) => {
    for (const test of HOST_AND_PORT_TESTS) {
        const match = test.regexp.exec(host)

        if (!match) {
            continue
        }

        const result = {
            host,
            hostname: match[1],
            isIPOrLocalhost: test.isIPOrLocalhost
        }

        // Split apart and get the hostname and port from the host
        if (test.hasPort) {
            let parts
            switch (test.type) {
                case IPV6:
                    // Filter out empty nodes fromt he array. We only care about
                    // the ones that have values
                    parts = result.host.split(test.regexp).filter((part) => part.length > 0)
                    break
                case IPV4:
                case LOCALHOST:
                default:
                    parts = result.host.split(':')
                    break
            }
            ;[result.hostname, result.port] = parts
        }

        return result
    }

    return {
        host,
        hostname: host,
        isIPOrLocalhost: false
    }
}

// Cookie domain rewrite logic for rewriteSetCookies below
export const rewriteDomain = (domain, appHostname, targetHost) => {
    // Strip any leading dots off the domain and split into elements
    const domainElements = domain.split('.').filter((x) => x)
    const domainString = domainElements.join('.')

    // Does the appHostname include a port number? We need a version
    // of it without the port (hostname) because set-cookie domains cannot
    // include ports. We can't just test for ':' because the host might be an
    // ipv6 address. An ipv6 address containing a port contains the
    // actual IP surrounded by [] (e.g. [2001:db8::1]:8080)
    // RFC3986
    const parsedHost = parseHost(appHostname)

    // If the target host equals or ends with the domainString
    // value, then we change the domain to be the appHostname
    // (though for localhost, we strip off the port number)
    if (targetHost === domainString) {
        // Straight replacement
        return parsedHost.hostname
    }

    if (!targetHost.endsWith(domainString)) {
        // Third-party cookie... leave unchanged
        return domain
    }

    // Cookie is set for a subdomain.
    if (parsedHost.isIPOrLocalhost) {
        // No subdomains for IP addresses or localhost, so return just that domain
        return parsedHost.hostname
    }

    // This is tricky... there's no standard way to get the domain for
    // a hostname. We use a shortcut - we build up a subdomain based on the
    // appHost that has the same number of elements as the cookie domain.
    const targetHostElements = targetHost.split('.')
    // Work out how many elements have been removed to form the subdomain
    const strippedOff = targetHostElements.length - domainElements.length
    // Strip the same number of elements off the appHost
    const appHostnameElements = parsedHost.hostname.split('.')
    return appHostnameElements.slice(strippedOff).join('.')
}

/**
 * Given a headers object, rewrite any set-cookie headers in it
 * so that they apply to the app hostname rather than the target
 * hostname.
 *
 * @private
 * @param appHostname {String} the hostname (host+port) under which the
 * SSR server is running (e.g. localhost:3443 for a local dev server)
 * @param targetHost {String} the target hostname (host+port)
 * @param logging {Boolean} true to log operations
 * @param setCookies {Array<String>} Array of set-cookie header values
 * @returns Array<String> of rewritten set-cookie header values
 */
export const rewriteSetCookies = ({appHostname, setCookies, targetHost, logging}) => {
    if (!(setCookies && setCookies.length)) {
        return []
    }

    // Parse the set-cookie headers into a set of objects
    const oldCookies = parseSetCookie(setCookies, {decodeValues: false})

    // Map the oldCookies array into an array of updated objects
    const newCookies = oldCookies.map((cookie) => {
        if (cookie.domain) {
            const newDomain = rewriteDomain(cookie.domain, appHostname, targetHost)

            /* istanbul ignore next */
            if (logging) {
                console.log(
                    `Rewriting proxy response set-cookie header domain from "${cookie.domain}" to "${newDomain}"`
                )
            }

            cookie.domain = newDomain
        }

        return cookie
    })

    // Convert the cookies back to string values
    return newCookies.map(cookieAsString)
}

/**
 * Rewrite headers for a proxied response.
 *
 * 1. If the original domain appears in the
 * Access-Control-Allow-Origin header, it's replaced with the
 * appOrigin.
 * 2. If the response is a 30x redirection and contains a Location
 * header on the target host, that header is rewritten to use the
 * app host and proxy path.
 *
 * For a caching proxy, we also remove any Set-Cookie headers - caching
 * proxies don't pass Cookie headers for requests and don't allow Set-Cookie
 * in responses, so that they may be cached independently of any cookie
 * values.
 *
 * @private
 * @param appHostname {String} the hostname (host+port) under which the
 * SSR server is running (e.g. localhost:3443 for a local dev server)
 * @param caching {Boolean} true for a caching proxy, false for a standard proxy
 * @param proxyPath {String} the path being proxied (e.g. /mobify/proxy/base/)
 * @param targetProtocol {String} the protocol to use to make requests to
 * the target ('http' or 'https')
 * @param requestUrl {String} the URL from the request that prompted the
 * response. If present, used to set the X-Proxy-Request-Url header. This should
 * be the request URL sent to the target host, not containing any
 * /mobify/proxy/... part.
 * @param targetHost {String} the target hostname (host+port)
 * @param appProtocol {String} the protocol to use to make requests to
 * the origin ('http' or 'https', defaults to 'https'), use of unencrypted
 * protocol is only allowed in local development
 * @param logging {Boolean} true to log operations
 * @param headers {Object} the headers to be rewritten
 * @param headerFormat {String} 'aws' or 'http' - the format of the 'headers'
 * parameter
 * @param statusCode {Number} the response status code
 * @returns {Object} - the modified response headers
 */
export const rewriteProxyResponseHeaders = ({
    appHostname,
    caching,
    headers,
    headerFormat = 'http',
    proxyPath,
    requestUrl,
    statusCode = 200,
    targetProtocol,
    targetHost,
    appProtocol = 'https',
    logging = false
}) => {
    const workingHeaders = new Headers(headers ? {...headers} : {}, headerFormat)

    const appOrigin = `${appProtocol}://${appHostname}`
    const targetOrigin = `${targetProtocol}://${targetHost}`

    // Set the X-Proxy-Request-Url header, if we have the request URL
    if (requestUrl) {
        // If the requestUrl is just a path, prepend the targetOrigin.
        // Including the full URL as a header value risks exceeding limits
        // on header value sizes. CloudFront limits URLs to 8192 bytes.
        // Even though API Gateway has a header value limit of
        // 10240 bytes, we choose to limit the length of the header
        // value to 8192 bytes.
        const fullRequestUrl = (requestUrl.startsWith('/')
            ? `${targetOrigin}${requestUrl}`
            : requestUrl
        ).slice(0, MAX_URL_LENGTH_BYTES)
        logging &&
            console.log(
                `Setting proxy response ${X_PROXY_REQUEST_URL} header to "${fullRequestUrl}"`
            )
        workingHeaders.setHeader(X_PROXY_REQUEST_URL, fullRequestUrl)
    }

    // Get a version of the proxyPath that does not end in a slash
    /* istanbul ignore next */
    const proxyPathBase = proxyPath.endsWith('/') ? proxyPath.slice(0, -1) : proxyPath

    const allowOrigin = workingHeaders.getHeader(AC_ALLOW_ORIGIN)
    logging && allowOrigin && console.log(`Header ${AC_ALLOW_ORIGIN} has value "${allowOrigin}"`)
    if (allowOrigin === targetOrigin) {
        /* istanbul ignore next */
        if (logging) {
            console.log(`Rewriting proxy response ${AC_ALLOW_ORIGIN} header to "${appOrigin}"`)
        }
        workingHeaders.setHeader(AC_ALLOW_ORIGIN, appOrigin)
    }

    if (caching) {
        // For a caching proxy, remove any Set-Cookie headers
        workingHeaders.deleteHeader(SET_COOKIE)
    } else {
        // For a standard proxy, rewrite domains in any set-cookie headers.
        const updatedCookies = rewriteSetCookies({
            appHostname,
            setCookies: workingHeaders.getSetCookie(),
            targetHost,
            logging
        })
        workingHeaders.setSetCookie(updatedCookies)
    }

    // Handle any redirect
    if (statusCode >= 301 && statusCode <= 308) {
        logging && console.log(`Status code is ${statusCode}, checking Location header`)
        const location = workingHeaders.getHeader(LOCATION)
        logging && console.log(`Location header has value "${location}"`)

        /* istanbul ignore else */
        if (location) {
            // The Location header is defined as a URL, meaning that it
            // can be both protocol- and host-relative, so we expand it
            // relative to the targetOrigin.
            const locUrl = new URL(location, targetOrigin)

            // If the location header URL is on the targetOrigin, we rewrite it.
            if (locUrl.protocol === `${targetProtocol}:` && locUrl.host === targetHost) {
                // Rewrite the Location value to map to the proxy path
                // on the app host.
                locUrl.protocol = appProtocol
                locUrl.host = appHostname
                // Since the proxyPath ends with a slash and locUrl.pathname
                // will start with a slash, we need to
                locUrl.pathname = proxyPathBase + locUrl.pathname
                const newLocation = locUrl.toString()
                workingHeaders.setHeader(LOCATION, newLocation)
                /* istanbul ignore else */
                if (logging) {
                    console.log(
                        `Rewriting proxy response Location header from "${location}" to "${newLocation}"`
                    )
                }
            }
        }
    }

    return workingHeaders.toObject()
}

/**
 * List of x- headers that are removed from proxied requests.
 * @private
 * @type {string[]}
 */
export const X_HEADERS_TO_REMOVE = [
    'x-api-key',
    'x-mobify-access-key',
    'x-apigateway-event',
    'x-apigateway-context'
]

/**
 * X-header key and values to add to proxied requests
 * @private
 * @type {Object}
 */
export const X_HEADERS_TO_ADD = {
    'x-mobify': 'true'
}

/**
 * List of headers that are allowed for a caching proxy request.
 * This must match the whitelist that CloudFront uses for a
 * CacheBehavior that does not pass cookies and is not configured
 * to cache based on headers.
 *
 * This is a map from lower-case header name to 'true' - we use an object
 * to make lookups fast, since this mapping might be used for many requests.
 *
 * Also see what is configured in the SSR Manager (ssr-infrastructure repo),
 * in the CloudFront configuration. This list is a superset of that list,
 * since the proxying code must also allow headers that it adds, such as
 * Host, Origin, etc.
 *
 * See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/header-caching.html
 * See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Cookies.html
 *
 * @private
 */
export const WHITELISTED_CACHING_PROXY_REQUEST_HEADERS = {
    // This is the set of headers whitelisted for CloudFront
    accept: true,
    'accept-charset': true,
    'accept-encoding': true,
    'accept-language': true,
    authorization: true,
    range: true,

    // These headers must be preserved in the request so that
    // header processing works correctly.
    host: true,
    origin: true,

    // Where CloudFront does the proxying, these headers are
    // generated by CloudFront itself. Where the SSR Server
    // does it, we forward them.
    'if-match': true,
    'if-modified-since': true,
    'if-none-match': true,
    'if-range': true,
    'if-unmodified-since': true
}

/**
 * Rewrite headers for a request that is being proxied.
 *
 * 1. If the request contains a Host header, rewrite it so that the
 * value is the target host.
 * 2. If the request contains an Origin header, rewrite it so that the
 * value is the target host.
 * 3. ALL other header values are left unchanged. If they are multi-value
 * headers whose values are stored as arrays, the values are left as arrays.
 *
 * @private
 * @param caching {Boolean} true for a caching proxy, false for a standard proxy
 * @param headers {Object} the headers to be rewritten
 * @param headerFormat {String} 'aws' or 'http' - the format of the 'headers'
 * parameter
 * @param targetProtocol {String} the protocol to use to make requests to
 * the target ('http' or 'https')
 * @param targetHost {String} the target hostname (host+port)
 * @param logging {Boolean} true to log operations
 * @returns {Object} - the modified request headers
 */
export const rewriteProxyRequestHeaders = ({
    caching = false,
    headers,
    headerFormat = 'http',
    targetProtocol,
    targetHost,
    logging = false
}) => {
    if (!headers) {
        return {}
    }
    const workingHeaders = new Headers({...headers}, headerFormat)

    // Strip out some specific X-headers
    X_HEADERS_TO_REMOVE.forEach((key) => workingHeaders.deleteHeader(key))

    // For a caching proxy, apply special header processing
    if (caching) {
        // Remove any non-whitelisted headers
        workingHeaders.keys().forEach((key) => {
            if (!WHITELISTED_CACHING_PROXY_REQUEST_HEADERS[key]) {
                workingHeaders.deleteHeader(key)
            }
        })

        // Override user-agent - mimic the behaviour of CloudFront
        workingHeaders.setHeader(USER_AGENT, 'Amazon CloudFront')
    }

    // Fix up any Host header. We ignore any current value and
    // always replace it with the target host.
    // Host: <host>:<port>
    const hostHeader = workingHeaders.getHeader(HOST)
    if (hostHeader !== targetHost) {
        /* istanbul ignore else */
        if (logging) {
            console.log(
                `Rewriting proxy request Host header from "${hostHeader}" to "${targetHost}"`
            )
        }
        workingHeaders.setHeader(HOST, targetHost)
    }

    // Fix up any Origin header. We ignore any current value and
    // always replace it with the targetOrigin
    // Origin: <scheme> "://" <hostname> [ ":" <port> ]
    const originHeader = workingHeaders.getHeader(ORIGIN)
    const targetOrigin = `${targetProtocol}://${targetHost}`
    if (originHeader && originHeader !== targetOrigin) {
        /* istanbul ignore else */
        if (logging) {
            console.log(
                `Rewriting proxy request Origin header from "${originHeader}" to "${targetOrigin}"`
            )
        }
        workingHeaders.setHeader(ORIGIN, targetOrigin)
    }

    // Replace some headers with hardwired values
    if (workingHeaders.getHeader(USER_AGENT)) {
        // Mimic the behaviour of CloudFront
        workingHeaders.setHeader(USER_AGENT, 'Amazon CloudFront')
    }

    // Add some specific X-headers
    Object.entries(X_HEADERS_TO_ADD).forEach(([key, value]) => {
        /* istanbul ignore else */
        if (logging) {
            console.log(`Adding a proxy request ${key} header with value "${value}"`)
        }
        workingHeaders.setHeader(key, value)
    })

    return workingHeaders.toObject()
}
