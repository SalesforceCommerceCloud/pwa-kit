/**
 * Preview will use preview.mobify.com to open a website and allow you to preview
 * a given bundle. The site URL and bundle URL should be passed in. The command will fail if it doesn't see a mobify ID.
 *
 * Usage:
 * ```
 *    this.demoTest = function (client) {
 *      browser.preview('https://www.merlinspotions.com', 'https://localhost:8443/loader.js');
 *    };
 * ```
 *
 * @method preview
 * @param {string} [url] Corresponds to the Site URL field on https://preview.mobify.com
 * @param {string} [bundle] Corresponds to the Bundle Location field on https://preview.mobify.com
 * @param {function} [callback] Optional callback function to be called when the command finishes.
 * @api commands
 */

const qs = require('querystring')

exports.command = function(url, bundle = 'https://localhost:8443/loader.js', callback) {
    const browser = this

    if (arguments.length < 2) {
        throw new Error('Usage: browser.preview(url, bundle, callback)')
    }

    if (typeof bundle === 'function') {
        callback = bundle
        bundle = null
    }

    const params = qs.stringify({url, site_folder: bundle})

    return browser
        .url(`https://preview.mobify.com?${params}`)
        .waitForElementPresent('#authorize', 10000, function() {
            this.click('#authorize', () => {
                browser.waitForElementPresent('[id*="mobify"]', 10000, false, (result) => {
                    if (typeof callback === 'function') {
                        callback.call(browser, result)
                    }
                })
            })
        })
}
