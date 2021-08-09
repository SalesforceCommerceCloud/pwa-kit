import request from 'superagent'
import * as cj from 'cookiejar'

/**
 * Cookie-rewriting details:
 *
 * ScrapingConnector uses a cookie-jar (through superagent) to
 * handle sessions on traditional HTML backends. This lets
 * us make authenticated request client- *and* server-side,
 * for Desktop, etc.
 *
 * To maintain sessions when running server-side, ScrapingConnector
 * supports cookie re-writing. Eg:
 *
 *  1) Imagine you are running shop.com (the real backend) and
 *     upwa-shop.com (a server-side proxy using this Connector).
 *
 *  2) A browser requests a resource from the proxy, which
 *     forwards a request to shop.com. The shop.com response
 *     contains the header "set-cookie: session=1; domain=shop.com"
 *
 *  3) Before responding to the browser, this connector
 *     rewrites the cookie domain to proxy-shop.com, so that
 *     it will be included on the subsequent request from the
 *     browser to the proxy.
 */

/**
 * A base class for screen-scraping connectors.
 *
 * ScrapingConnector does three things:
 *
 *  1) Allows `window` to be injected, so we can swap it for JSDOM
 *     and run the Connector outside of a browser.
 *
 *  2) Supports cookie-based sessions server-side, using a
 *     cookie-jar and domain-name rewriting.
 *
 *  3) Lets us get/set default headers for requests.
 *
 */
export class ScrapingConnector {
    /**
     * @param {Window} window A browser-native window or JSDOM implementation.
     * @param {Object.<string, string>} cookieDomainRewrites the domains to rewrite
     *   on any cookies received from the backend, eg.`{"shop.com": "proxy-shop.com"}`
     */
    constructor({window, cookieDomainRewrites}) {
        this.window = window
        this.cookieDomainRewrites = cookieDomainRewrites || {}
        this.agent = request.agent()
        this.cookieJarSnapshot = null
    }

    /**
     * Return a Document constructed from a superagent HTTP response. Use
     * to parse content out of the DOM.
     *
     * @param {HTTPResponse} res a superagent http response, expected to be HTML.
     * @returns {Document}
     */
    buildDocument(res) {
        const doc = this.window.document.implementation.createHTMLDocument()
        doc.documentElement.innerHTML = res.text
        return doc
    }

    /**
     * @inheritDoc
     */
    getDefaultHeaders() {
        const headers = this.agent._defaults
            .filter((defaultCall) => defaultCall.fn === 'set')
            .map((header) => ({[header.arguments[0]]: header.arguments[1]}))
        return Object.assign({}, headers)
    }

    /**
     * @inheritDoc
     */
    setDefaultHeaders(headers) {
        Object.keys(headers).forEach((k) => {
            this.agent.set(k, headers[k])
        })
    }

    inBrowser() {
        return typeof window !== 'undefined'
    }

    /**
     * Get all *new or changed* cookies in the Connector's cookie jar,
     * since creation or the last call to `setCookies()`.
     *
     * Each returned cookie can be set directly as a header on an HTTP
     * response in the "set-cookie" header.
     *
     * This is only for use *outside* a browser. In the browser, cookies
     * are handled automatically.
     *
     * Example return value:
     *
     *    `["a=b; domain=example.com; path=/", "c=d; domain=example2.com; path=/"]`
     *
     * @returns {Array.<String>}
     */
    getCookies() {
        if (!this.inBrowser()) {
            const rewrites = this.cookieDomainRewrites || {}
            const rewriter = (cookie) => ScrapingConnector.rewriteCookieDomain(rewrites, cookie)
            const snapshot = this.cookieJarSnapshot || new cj.CookieJar()
            return ScrapingConnector.diffCookieJars(snapshot, this.agent.jar)
                .map(rewriter)
                .map((cookie) => cookie.toString())
        } else {
            return []
        }
    }

    /**
     * Set the initial cookies on the connector.
     *
     * The `cookies` parameter must be in the format for the `Cookie` header
     * taken directly from an HTTP request, eg: `"a=b; c=d"`
     *
     * @param {String} cookies
     */
    setCookies(cookies) {
        if (!this.inBrowser()) {
            cookies = cookies || ''
            cookies
                .split('; ')
                .filter((x) => x !== '')
                .forEach((c) => this.agent.jar.setCookies(c))
            this.cookieJarSnapshot = ScrapingConnector.cloneCookieJar(this.agent.jar)
        }
    }

    static cloneCookie(cookie) {
        return Object.assign(new cj.Cookie(), cookie)
    }

    static cloneCookieJar(jar) {
        const clone = new cj.CookieJar()
        jar.getCookies(cj.CookieAccessInfo.All).forEach((c) => {
            clone.setCookie(ScrapingConnector.cloneCookie(c))
        })
        return clone
    }

    /**
     * Returns the cookies that are new or changed in `newJar`.
     *
     * @param oldJar {CookieJar}
     * @param newJar {CookieJar}
     * @returns {Array<Cookie>}
     */
    static diffCookieJars(oldJar, newJar) {
        const oldCookies = oldJar.getCookies(cj.CookieAccessInfo.All).map((c) => c.toString())
        return newJar
            .getCookies(cj.CookieAccessInfo.All)
            .filter((c) => oldCookies.indexOf(c.toString()) < 0)
    }

    /**
     * Clone `cookie` replace `originalDomain` with `proxyDomain` if the
     * original cookie had an explicit domain set.
     *
     * This is for server-side usage, eg. when running the IM as a proxy
     * on a different domain than the original ecommerce backend.
     *
     * @param {Object<String, String>} rewrites
     * @param {Array<Cookie>} cookie
     * @returns {Array<Cookie>}
     */
    static rewriteCookieDomain(rewrites, cookie) {
        const clone = ScrapingConnector.cloneCookie(cookie)
        clone.domain = rewrites[clone.domain] || clone.domain
        return clone
    }
}
