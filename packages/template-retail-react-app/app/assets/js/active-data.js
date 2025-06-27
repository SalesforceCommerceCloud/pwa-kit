/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*!
 * dwAnalytics - Web Analytics Tracking
 * Based partially on Piwik
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 */
;(function (dw) {
    /*
     * Contents of head-active_data.js
     */
    dw.ac = {
        _analytics: null,
        _events: [],
        _category: '',
        _searchData: '',
        _anact: '',
        _anact_nohit_tag: '',
        _analytics_enabled: 'true',
        _timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        _capture: function (configs) {
            if (Object.prototype.toString.call(configs) === '[object Array]') {
                configs.forEach(captureObject)
                return
            }
            dw.ac._events.push(configs)
        },
        capture: function () {
            dw.ac._capture(arguments)
            // send to CQ as well:
            if (window.CQuotient) {
                window.CQuotient.trackEventsFromAC(arguments)
            }
        },
        EV_PRD_SEARCHHIT: 'searchhit',
        EV_PRD_DETAIL: 'detail',
        EV_PRD_RECOMMENDATION: 'recommendation',
        EV_PRD_SETPRODUCT: 'setproduct',
        applyContext: function (context) {
            if (
                typeof context === 'object' &&
                Object.prototype.hasOwnProperty.call(context, 'category')
            ) {
                dw.ac._category = context.category
            }
            if (
                typeof context === 'object' &&
                Object.prototype.hasOwnProperty.call(context, 'searchData')
            ) {
                dw.ac._searchData = context.searchData
            }
        },
        setDWAnalytics: function (analytics) {
            dw.ac._analytics = analytics
        },
        eventsIsEmpty: function () {
            return 0 == dw.ac._events.length
        }
    }

    /*
     * Contents of dwac-21.7.js
     */

    // Returns the value of the first cookie found whose name is accepted by the given function
    function getCookieValue(/*function(x)*/ acceptFunction) {
        var cookiePairs = document.cookie.split(';')
        for (var i = 0; i < cookiePairs.length; i++) {
            var index = cookiePairs[i].indexOf('=')
            if (index != -1) {
                var name = trim(cookiePairs[i].substring(0, index))
                if (acceptFunction(name)) {
                    return trim(unescape(cookiePairs[i].substring(index + 1)))
                }
            }
        }

        return null
    }

    // trims a string, replacing the jquery.trim
    function trim(/*string*/ value) {
        return value.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
    }

    // Sets a cookie with the given name and value
    function setCookieValue(/*string*/ name, /*string*/ value, /*integer*/ millisToExpiry) {
        var cookie = name + '=' + escape(value) + ';path=/'
        if (millisToExpiry != -1) {
            var expiryDate = new Date()
            expiryDate.setTime(expiryDate.getTime() + millisToExpiry)
            cookie += ';expires=' + expiryDate.toGMTString()
        }
        document.cookie = cookie
    }

    // URL encodes the given string to match the Java URLEncoder class
    function urlencode(/*string*/ value) {
        var convertByte = function (code) {
            if (code < 32) {
                //numbers lower than 32 are control chars, not printable
                return ''
            } else {
                return '%' + new Number(code).toString(16).toUpperCase()
            }
        }

        var encoded = ''
        for (var i = 0; i < value.length; i++) {
            var c = value.charCodeAt(i)
            if (
                (c >= 97 && c <= 122) ||
                (c >= 65 && c <= 90) ||
                (c >= 48 && c <= 57) ||
                c == 46 ||
                c == 45 ||
                c == 42 ||
                c == 95
            ) {
                encoded += value.charAt(i) // a-z A-z 0-9 . - * _
            } else if (c == 32) {
                encoded += '+' // (space)
            } else if (c < 128) {
                encoded += convertByte(c)
            } else if (c >= 128 && c < 2048) {
                encoded += convertByte((c >> 6) | 0xc0)
                encoded += convertByte((c & 0x3f) | 0x80)
            } else if (c >= 2048 && c < 65536) {
                encoded += convertByte((c >> 12) | 0xe0)
                encoded += convertByte(((c >> 6) & 0x3f) | 0x80)
                encoded += convertByte((c & 0x3f) | 0x80)
            } else if (c >= 65536) {
                encoded += convertByte((c >> 18) | 0xf0)
                encoded += convertByte(((c >> 12) & 0x3f) | 0x80)
                encoded += convertByte(((c >> 6) & 0x3f) | 0x80)
                encoded += convertByte((c & 0x3f) | 0x80)
            }
        }

        return encoded
    }

    // Returns the value of the analytics cookie set on the server
    function getAnalyticsCookieValue() {
        var acceptFunction = function (name) {
            return name.length > 5 && name.substring(0, 5) === 'dwac_'
        }
        return getCookieValue(acceptFunction)
    }

    // Contextual information retrieved from the server
    var analyticsContext = (function () {
        if (dw.ac._analytics_enabled === 'false') {
            return {
                enabled: false,
                dwEnabled: false
            }
        }
        var cookieValue = getAnalyticsCookieValue()
        if (cookieValue == null) {
            return {
                visitorID: '__ANNONYMOUS__',
                customer: '__ANNONYMOUS__',
                siteCurrency: '',
                sourceCode: '',
                enabled: 'true',
                timeZone: dw.ac._timeZone,
                dwEnabled: 'true',
                encoding: 'ISO-8859-1'
            }
        }

        var tokens = cookieValue.split('|')

        return {
            visitorID: tokens[0],
            repository: tokens[1],
            customer: tokens[2],
            sourceCode: tokens[3],
            siteCurrency: tokens[4],
            enabled: tokens[5] == 'true',
            timeZone: tokens[6],
            dwEnabled: tokens[7] == 'true',
            encoding: 'ISO-8859-1'
        }
    })()

    // Turn debugging on or off
    var setDebugEnabled = function (enabled) {
        if (typeof enabled != 'boolean') {
            return
        }

        setCookieValue('dwacdebug', '' + enabled, -1)
    }

    // Returns true if debug is enabled, false otherwise
    function isDebugEnabled() {
        var acceptFunction = function (name) {
            return name === 'dwacdebug'
        }
        return getCookieValue(acceptFunction) === 'true'
    }

    // Map data structure
    function Map() {
        var data = []

        // Returns an array containing the entries in this map
        this.getEntries = function () {
            return data
        }

        // Puts the given value in this map under the given key
        this.put = function (/*object*/ key, /*object*/ value) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].key == key) {
                    data[i].value = value
                    return
                }
            }

            data.push({key: key, value: value})
        }

        // Puts all the key value pairs in the given map into this map
        this.putAll = function (/*Map*/ map) {
            var entries = map.getEntries()
            for (var i = 0; i < entries.length; i++) {
                this.put(entries[i].key, entries[i].value)
            }
        }

        // Returns the value in this map under the given key, or null if there is no such value
        this.get = function (/*object*/ key) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].key == key) {
                    return data[i].value
                }
            }

            return null
        }

        // Clears this map of entries
        this.clear = function () {
            data.length = 0
        }

        // Returns if this map is empty of values
        this.isEmpty = function () {
            return data.length == 0
        }
    }

    // Delay in milliseconds before actually submitting data once some is ready
    var SUBMIT_DELAY_MILLIS = 500

    // Set when the DOM is ready
    var domReady = false

    // Timeout to submit data after a delay
    var submitTimeout = null

    // Product impressions found on the page
    var productImpressions = new Map()

    // Product views found on the page
    var productViews = new Map()

    // Product recommendations found on the page
    var productRecommendations = new Map()

    // Applies values from the given source for fields defined in the given target
    function applyFields(/*object*/ source, /*object*/ target) {
        for (var e in target) {
            if (typeof source[e] != 'undefined') {
                target[e] = source[e]
            }
        }
        return target
    }

    // Collects the given product impression, and returns true if it is valid or false if it is not
    var collectProductImpression = function (/*object*/ configs) {
        if (typeof configs != 'object') {
            return false
        }

        var pi = applyFields(configs, {id: null})

        // Quit if no SKU provided or is invalid
        if (typeof pi.id != 'string') {
            return false
        }

        // Throw out the impression if SKU already seen
        var previousImpression = productImpressions.get(pi.id)
        if (previousImpression != null) {
            return false
        }

        productImpressions.put(pi.id, pi)
        return true
    }

    // Collects the given product recommendation, and returns true if it is valid or false if it is not
    var collectProductRecommendation = function (/*object*/ configs) {
        if (typeof configs != 'object') {
            return false
        }

        var pr = applyFields(configs, {id: null})

        // Quit if no SKU provided or is invalid
        if (typeof pr.id != 'string') {
            return false
        }

        // Throw out the recommendation if SKU already seen
        var previousRecommendation = productRecommendations.get(pr.id)
        if (previousRecommendation != null) {
            return false
        }

        productRecommendations.put(pr.id, pr)
        return true
    }

    // Collects the given product view, and returns true if it is valid or false if it is not
    var collectProductView = function (/*object*/ configs) {
        if (typeof configs != 'object') {
            return false
        }

        var pv = applyFields(configs, {id: null})

        // Quit if no SKU provided or is invalid
        if (typeof pv.id != 'string') {
            return false
        }

        // Throw out the view if SKU already seen
        var previousView = productViews.get(pv.id)
        if (previousView != null) {
            return false
        }

        productViews.put(pv.id, pv)
        return true
    }

    // Performs the actual submission of collected data for analytics processing
    var performDataSubmission = function () {
        if (dw.ac._analytics != null) {
            var collectedData = {
                pageInfo: dw.ac._category,
                productImpressions: productImpressions,
                productViews: productViews,
                productRecommendations: productRecommendations,
                debugEnabled: isDebugEnabled()
            }
            dw.ac._analytics.trackPageViewWithProducts(analyticsContext, collectedData, null)
            productImpressions.clear()
            productViews.clear()
            productRecommendations.clear()
            dw.ac._events.length = 0
        }
    }

    // Submits the collected data for analytics processing after a short delay
    function submitCollectedData() {
        // don't submit the data before dom is ready, the data is still collected,
        // when dom is ready, the onDocumentReady method will call this method again.
        if (!domReady) {
            return
        }

        if (submitTimeout) {
            clearTimeout(submitTimeout)
        }

        submitTimeout = setTimeout(performDataSubmission, SUBMIT_DELAY_MILLIS)
    }

    // Returns an object with the same properties as the given object, but with string type properties
    // in the given array of names set to the URL encoded form of their values using the escape function
    function escapeProperties(/*object*/ o, /*Array*/ props) {
        if (typeof o == 'undefined') {
            return
        }

        var copy = {}
        for (var e in o) {
            var escapeProp = false
            for (var i = 0; i < props.length && !escapeProp; i++) {
                var prop = props[i]
                if (e === prop && typeof o[prop] == 'string') {
                    escapeProp = true
                }
            }

            copy[e] = escapeProp ? urlencode(o[e]) : o[e]
        }

        return copy
    }

    // Captures the given object data collected in subsequent events on the page,
    // and returns true if the given object data is valid, or returns false if not
    function captureObject(/*object*/ configs) {
        if (typeof configs != 'object') {
            return false
        }

        if (configs.type === dw.ac.EV_PRD_SEARCHHIT || configs.type === dw.ac.EV_PRD_SETPRODUCT) {
            return collectProductImpression(escapeProperties(configs, ['id']))
        }

        if (configs.type === dw.ac.EV_PRD_DETAIL) {
            return collectProductView(escapeProperties(configs, ['id']))
        }

        if (configs.type === dw.ac.EV_PRD_RECOMMENDATION) {
            return collectProductRecommendation(escapeProperties(configs, ['id']))
        }

        return false
    }

    // Captures the given data collected in subsequent events on the page
    function captureAndSend(/*object*/ configs) {
        if (typeof configs == 'undefined') {
            return
        }

        // Support both array and single object cases
        if (typeof configs === 'object') {
            if (configs instanceof Array) {
                for (var i = 0; i < configs.length; i++) {
                    captureObject(configs[i])
                }
            } else {
                if (configs[0] instanceof Object) {
                    captureObject(configs[0])
                } else {
                    captureObject(configs)
                }
            }
        }

        // Submit captured data if appropriate
        if (domReady) {
            submitCollectedData()
        }
    }

    // Enhance existing capture function with submission step
    dw.ac.capture = captureAndSend

    // expose debug API
    dw.ac.setDebugEnabled = setDebugEnabled

    dw.ac._handleCollectedData = function () {
        domReady = false
        dw.ac._events.forEach(captureAndSend)
        domReady = true
        submitCollectedData()
    }

    dw.ac._scheduleDataSubmission = function () {
        if (dw.ac._submitTimeout) {
            clearTimeout(dw.ac._submitTimeout)
        }
        dw.ac._submitTimeout = setTimeout(dw.ac._handleCollectedData, 500)
    }

    // Added specifically for PWA kit to set currency for Analytics Context
    dw.ac._setSiteCurrency = function setSiteCurrency(currency) {
        analyticsContext.siteCurrency = currency
    }

    // replace jQuery.ready() function
    ;(function onDocumentReady(callback) {
        // Catch cases where $(document).ready() is called after the browser event has already occurred.
        if (document.readyState === 'complete') {
            // Handle it asynchronously to allow scripts the opportunity to delay ready
            setTimeout(callback, 1)
        }

        // Mozilla, Opera and webkit nightlies currently support this event
        var DOMContentLoaded
        if (document.addEventListener) {
            DOMContentLoaded = function () {
                document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false)
                callback()
            }
            // Use the handy event callback
            document.addEventListener('DOMContentLoaded', DOMContentLoaded, false)
            // A fallback to window.onload, that will always work
            window.addEventListener('load', callback, false)
            // If IE event model is used
        } else if (document.attachEvent) {
            DOMContentLoaded = function () {
                // Make sure body exists, at least, in case IE gets a little overzealous
                if (document.readyState === 'complete') {
                    document.detachEvent('onreadystatechange', DOMContentLoaded)
                    callback()
                }
            }
            // ensure firing before onload, maybe late but safe also for iframes
            document.attachEvent('onreadystatechange', DOMContentLoaded)

            // A fallback to window.onload, that will always work
            window.attachEvent('onload', callback)
        }
    })(function () {
        dw.ac._handleCollectedData()
    })

    /*
     * Contents of dwanalytics-22.2.js
     */
    if (typeof dw.__dwAnalyticsLoaded == 'undefined') {
        dw.__dwAnalyticsLoaded = true

        // DWAnalytics singleton and namespace
        dw.__dwAnalytics = (function () {
            /************************************************************
             * Private data
             ************************************************************/

            var MAX_URL_LENGTH = 2000

            var /* alias frequently used globals for added minification */
                documentAlias = document,
                navigatorAlias = navigator,
                screenAlias = screen,
                windowAlias = window

            /************************************************************
             * Private methods
             ************************************************************/

            /*
             * Is property (or variable) defined?
             */
            function isDefined(property) {
                return typeof property !== 'undefined'
            }

            /*
             * DWAnalytics Tracker class
             *
             * trackerUrl and trackerSiteId are optional arguments to the constructor
             *
             * See: Tracker.setTrackerUrl() and Tracker.setSiteId()
             */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            function Tracker(trackerUrl, siteId) {
                /************************************************************
                 * Private members
                 ************************************************************/

                var // Tracker URL
                    configTrackerUrl = trackerUrl + '?' || '?',
                    // Document URL
                    configCustomUrl,
                    // Document title
                    configTitle = documentAlias.title,
                    // Client-side data collection
                    browserHasCookies = '0',
                    pageReferrer,
                    // Plugin, Parameter name, MIME type, detected
                    pluginMap = {
                        // document types
                        pdf: ['pdf', 'application/pdf', '0'],
                        // media players
                        quicktime: ['qt', 'video/quicktime', '0'],
                        realplayer: ['realp', 'audio/x-pn-realaudio-plugin', '0'],
                        wma: ['wma', 'application/x-mplayer2', '0'],
                        // interactive multimedia
                        director: ['dir', 'application/x-director', '0'],
                        flash: ['fla', 'application/x-shockwave-flash', '0'],
                        // RIA
                        java: ['java', 'application/x-java-vm', '0'],
                        gears: ['gears', 'application/x-googlegears', '0'],
                        silverlight: ['ag', 'application/x-silverlight', '0']
                    },
                    /*
                     * encode or escape
                     * - encodeURIComponent added in IE5.5
                     */
                    escapeWrapper = windowAlias.encodeURIComponent || escape,
                    /*
                     * decode or unescape
                     * - decodeURIComponent added in IE5.5
                     */
                    unescapeWrapper = windowAlias.decodeURIComponent || unescape

                /*
                 * Set cookie value
                 */
                function setCookie(cookieName, value, daysToExpire, path, domain, secure) {
                    var expiryDate

                    if (daysToExpire) {
                        // time is in milliseconds
                        expiryDate = new Date()
                        // there are 1000 * 60 * 60 * 24 milliseconds in a day (i.e., 86400000 or 8.64e7)
                        expiryDate.setTime(expiryDate.getTime() + daysToExpire * 8.64e7)
                    }

                    documentAlias.cookie =
                        cookieName +
                        '=' +
                        escapeWrapper(value) +
                        (daysToExpire ? ';expires=' + expiryDate.toGMTString() : '') +
                        ';path=' +
                        (path ? path : '/') +
                        (domain ? ';domain=' + domain : '') +
                        (secure ? ';secure' : '')
                }

                /*
                 * Get cookie value
                 */
                function getCookie(cookieName) {
                    var cookiePattern = new RegExp('(^|;)[ ]*' + cookieName + '=([^;]*)'),
                        cookieMatch = cookiePattern.exec(documentAlias.cookie)

                    return cookieMatch ? unescapeWrapper(cookieMatch[2]) : 0
                }

                /*
                 * Send image request to DWAnalytics server using GET.
                 * The infamous web bug is a transparent, single pixel (1x1) image
                 * Async with a delay of 100ms.
                 */
                function getImage(urls) {
                    dw.__timeoutCallback = function () {
                        for (var i = 0; i < urls.length; i++) {
                            var image = new Image(1, 1)
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            image.onLoad = function () {}
                            image.src = urls[i]
                        }
                    }
                    setTimeout(dw.__timeoutCallback, 100)
                }

                /*
                 * Browser plugin tests
                 */
                function detectBrowserPlugins() {
                    var i, mimeType

                    // Safari and Opera
                    // IE6: typeof navigator.javaEnabled == 'unknown'
                    if (
                        typeof navigatorAlias.javaEnabled !== 'undefined' &&
                        navigatorAlias.javaEnabled()
                    ) {
                        pluginMap.java[2] = '1'
                    }

                    // Firefox
                    if (typeof windowAlias.GearsFactory === 'function') {
                        pluginMap.gears[2] = '1'
                    }

                    if (navigatorAlias.mimeTypes && navigatorAlias.mimeTypes.length) {
                        for (i in pluginMap) {
                            mimeType = navigatorAlias.mimeTypes[pluginMap[i][1]]
                            if (mimeType && mimeType.enabledPlugin) {
                                pluginMap[i][2] = '1'
                            }
                        }
                    }
                }

                /*
                 * Get page referrer
                 */
                function getReferrer() {
                    var referrer = ''
                    try {
                        referrer = top.document.referrer
                    } catch (e) {
                        if (parent) {
                            try {
                                referrer = parent.document.referrer
                            } catch (e2) {
                                referrer = ''
                            }
                        }
                    }
                    if (referrer === '') {
                        referrer = documentAlias.referrer
                    }

                    return referrer
                }

                /*
                 * Does browser have cookies enabled (for this site)?
                 */
                function hasCookies() {
                    var testCookieName = '_pk_testcookie'
                    if (!isDefined(navigatorAlias.cookieEnabled)) {
                        setCookie(testCookieName, '1')
                        return getCookie(testCookieName) == '1' ? '1' : '0'
                    }

                    return navigatorAlias.cookieEnabled ? '1' : '0'
                }

                /*
                 * Log the page view / visit
                 */
                function logPageView(analyticsContext, collectedData, customTitle) {
                    var id = Math.random()

                    var tuples = constructDataSet(analyticsContext, collectedData, customTitle, id)

                    if (collectedData != null && collectedData.debugEnabled) {
                        var text = ''
                        for (var i = 0; i < tuples.length; i++) {
                            text += tuples[i][0] + '"=' + tuples[i][1] + '"\n'
                        }
                        alert(text)
                    }

                    var urls = createUrls(analyticsContext, configTrackerUrl, tuples, id)
                    getImage(urls)
                }

                /************************************************************
                 * Constructor
                 ************************************************************/

                /*
                 * initialize tracker
                 */
                pageReferrer = getReferrer()
                browserHasCookies = hasCookies()
                detectBrowserPlugins()

                try {
                    process_anact_cookie()
                    // eslint-disable-next-line no-empty
                } catch (err) {}

                /************************************************************
                 * Public data and methods
                 ************************************************************/

                return {
                    /*
                     * Log visit to this page  (called from the bottom of the page).
                     */
                    trackPageView: function (customTitle) {
                        logPageView(null, null, customTitle)
                    },
                    /*
                     * Log visit to this page (called from the dwac script).
                     */
                    trackPageViewWithProducts: function (
                        analyticsContext,
                        collectedData,
                        customTitle
                    ) {
                        logPageView(analyticsContext, collectedData, customTitle)
                    }
                }

                function appendToRequest(/*Array*/ tuple, /*string*/ request) {
                    var beginningChar = request.charAt(request.length - 1) == '?' ? '' : '&'
                    return request + beginningChar + tuple[0] + '=' + tuple[1]
                }

                function lengthOfTuple(/*Array*/ tuple) {
                    return tuple[0].length + tuple[1].length + 2
                }

                function constructDataSet(
                    /*object*/ analyticsContext,
                    collectedData,
                    /*string*/ customTitle,
                    /*number*/ id
                ) {
                    var tuples = [
                        [
                            'url',
                            escapeWrapper(
                                isDefined(configCustomUrl)
                                    ? configCustomUrl
                                    : documentAlias.location.href
                            )
                        ],
                        ['res', screenAlias.width + 'x' + screenAlias.height],
                        ['cookie', browserHasCookies],
                        ['ref', escapeWrapper(pageReferrer)],
                        [
                            'title',
                            escapeWrapper(
                                isDefined(customTitle) && customTitle != null
                                    ? customTitle
                                    : configTitle
                            )
                        ]
                    ]

                    // plugin data
                    for (var index in pluginMap) {
                        tuples.push([pluginMap[index][0], pluginMap[index][2]])
                    }

                    if (analyticsContext != null && analyticsContext.dwEnabled) {
                        tuples.push(['dwac', id])
                        tuples.push(['cmpn', analyticsContext.sourceCode])
                        tuples.push(['tz', analyticsContext.timeZone])

                        analyticsContext.category = dw.ac._category
                        if (dw.ac._searchData) {
                            analyticsContext.searchData = dw.ac._searchData
                        }

                        addProducts(analyticsContext, collectedData, tuples)
                    }

                    return tuples
                }

                function addProducts(
                    /*object*/ analyticsContext,
                    /*object*/ collectedData,
                    /*Array*/ tuples
                ) {
                    tuples.push(['pcc', analyticsContext.siteCurrency])
                    tuples.push(['pct', analyticsContext.customer])
                    tuples.push(['pcat', analyticsContext.category])
                    if (analyticsContext.searchData) {
                        if (analyticsContext.searchData.q)
                            tuples.push(['pst-q', analyticsContext.searchData.q])
                        if (analyticsContext.searchData.searchID)
                            tuples.push(['pst-id', analyticsContext.searchData.searchID])
                        if (analyticsContext.searchData.refs)
                            tuples.push(['pst-refs', analyticsContext.searchData.refs])
                        if (analyticsContext.searchData.sort)
                            tuples.push(['pst-sort', analyticsContext.searchData.sort])
                        if (undefined != analyticsContext.searchData.persd)
                            tuples.push(['pst-pers', analyticsContext.searchData.persd])
                        if (analyticsContext.searchData.imageUUID)
                            tuples.push(['pst-img', analyticsContext.searchData.imageUUID])
                        if (analyticsContext.searchData.suggestedSearchText)
                            tuples.push([
                                'pst-sug',
                                analyticsContext.searchData.suggestedSearchText
                            ])
                        if (analyticsContext.searchData.locale)
                            tuples.push(['pst-loc', analyticsContext.searchData.locale])
                        if (analyticsContext.searchData.queryLocale)
                            tuples.push(['pst-qloc', analyticsContext.searchData.queryLocale])
                        if (undefined != analyticsContext.searchData.showProducts)
                            tuples.push(['pst-show', analyticsContext.searchData.showProducts])
                    }

                    var pies = collectedData.productImpressions.getEntries()
                    var pres = collectedData.productRecommendations.getEntries()
                    var pves = collectedData.productViews.getEntries()

                    var count = 0
                    for (var i = 0; i < pies.length; i++) {
                        tuples.push(['pid-' + count, pies[i].value.id])
                        tuples.push(['pev-' + count, 'event3'])
                        count++
                    }

                    for (var j = 0; j < pres.length; j++) {
                        tuples.push(['pid-' + count, pres[j].value.id])
                        tuples.push(['pev-' + count, 'event3'])
                        tuples.push(['evr4-' + count, 'Yes'])
                        count++
                    }

                    for (var k = 0; k < pves.length; k++) {
                        tuples.push(['pid-' + count, pves[k].value.id])
                        tuples.push(['pev-' + count, 'event4'])
                        count++
                    }
                }

                function createUrls(analyticsContext, configTrackerUrl, tuples, id) {
                    var urls = []
                    var request = configTrackerUrl
                    for (var i = 0; i < tuples.length; i++) {
                        // we don't want to break up a product grouping, for example,
                        // ["pid-0","p1"],["pev-0","event3"],["evr4-0",'Yes'] should not be broken into two separate requests
                        var nextTupleIsProductAndWouldMakeRequestTooLong =
                            tuples[i][0].slice(0, 'pid-'.length) == 'pid-' &&
                            lengthOfTuple(tuples[i]) +
                                (i + 1 < tuples.length ? lengthOfTuple(tuples[i + 1]) : 0) +
                                (i + 2 < tuples.length ? lengthOfTuple(tuples[i + 2]) : 0) +
                                request.length >
                                MAX_URL_LENGTH

                        var nextTupleIsNotProductAndWouldMakeRequestTooLong =
                            tuples[i][0].slice(0, 'pid-'.length) != 'pid-' &&
                            lengthOfTuple(tuples[i]) + request.length > MAX_URL_LENGTH

                        if (
                            nextTupleIsProductAndWouldMakeRequestTooLong ||
                            nextTupleIsNotProductAndWouldMakeRequestTooLong
                        ) {
                            urls.push(request)
                            // close the current request and create a new one,
                            // the new request should have the basic dwac, cmpn,tz, pcc, pct, pcat values
                            request = appendToRequest(['dwac', id], configTrackerUrl)
                            if (analyticsContext != null && analyticsContext.dwEnabled) {
                                request = appendToRequest(
                                    ['cmpn', analyticsContext.sourceCode],
                                    request
                                )
                                request = appendToRequest(
                                    ['tz', analyticsContext.timeZone],
                                    request
                                )
                                request = appendToRequest(
                                    ['pcc', analyticsContext.siteCurrency],
                                    request
                                )
                                request = appendToRequest(
                                    ['pct', analyticsContext.customer],
                                    request
                                )
                                request = appendToRequest(
                                    ['pcat', analyticsContext.category],
                                    request
                                )
                                if (analyticsContext.searchData) {
                                    if (analyticsContext.searchData.q)
                                        appendToRequest(
                                            ['pst-q', analyticsContext.searchData.q],
                                            request
                                        )
                                    if (analyticsContext.searchData.searchID)
                                        appendToRequest(
                                            ['pst-id', analyticsContext.searchData.searchID],
                                            request
                                        )
                                    if (analyticsContext.searchData.refs)
                                        appendToRequest(
                                            [
                                                'pst-refs',
                                                JSON.stringify(analyticsContext.searchData.refs)
                                            ],
                                            request
                                        )
                                    if (analyticsContext.searchData.sort)
                                        appendToRequest(
                                            [
                                                'pst-sort',
                                                JSON.stringify(analyticsContext.searchData.sort)
                                            ],
                                            request
                                        )
                                    if (undefined != analyticsContext.searchData.persd)
                                        appendToRequest(
                                            ['pst-pers', analyticsContext.searchData.persd],
                                            request
                                        )
                                    if (analyticsContext.searchData.imageUUID)
                                        appendToRequest(
                                            ['pst-img', analyticsContext.searchData.imageUUID],
                                            request
                                        )
                                    if (analyticsContext.searchData.suggestedSearchText)
                                        appendToRequest(
                                            [
                                                'pst-sug',
                                                analyticsContext.searchData.suggestedSearchText
                                            ],
                                            request
                                        )
                                    if (analyticsContext.searchData.locale)
                                        appendToRequest(
                                            ['pst-loc', analyticsContext.searchData.locale],
                                            request
                                        )
                                    if (analyticsContext.searchData.queryLocale)
                                        appendToRequest(
                                            ['pst-qloc', analyticsContext.searchData.queryLocale],
                                            request
                                        )
                                    if (undefined != analyticsContext.searchData.showProducts)
                                        appendToRequest(
                                            ['pst-show', analyticsContext.searchData.showProducts],
                                            request
                                        )
                                }
                            }
                        }

                        request = appendToRequest(tuples[i], request)
                    }

                    // Add the "do not follow" cookie in the URL as a query param
                    // The cookie is set per-site, and gets applied to all sub-sites, if present
                    var doNotFollowCookieValue = getCookie('dw_dnt')

                    // If cookie not found
                    if (
                        doNotFollowCookieValue === 0 ||
                        doNotFollowCookieValue === '' ||
                        doNotFollowCookieValue === null ||
                        doNotFollowCookieValue === false
                    ) {
                        // do nothing, meaning tracking is allowed
                    }
                    // Cookie found, i.e. value should be '0' or '1' (string values)
                    else {
                        // Set whatever the cookie value is
                        request = appendToRequest(['dw_dnt', doNotFollowCookieValue], request)
                    }

                    urls.push(request)
                    return urls
                }
            }

            function extractCookieValueAndRemoveCookie(cookieName) {
                var cookieValue = extractEncodedCookieValue(cookieName)
                if (cookieValue) {
                    document.cookie =
                        cookieName + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
                }
                return cookieValue
            }

            function extractEncodedCookieValue(cookieName) {
                return (
                    decodeURIComponent(
                        document.cookie
                            .replace(
                                new RegExp(
                                    '(?:(?:^|.*;)\\s*' +
                                        encodeURIComponent(cookieName).replace(/[-.+*]/g, '\\$&') +
                                        '\\s*\\=\\s*([^;]*).*$)|^.*$'
                                ),
                                '$1'
                            )
                            .replace(/\+/g, '%20')
                    ) || null
                )
            }

            function process_anact_cookie() {
                if (dw.ac) {
                    dw.ac._anact = extractCookieValueAndRemoveCookie('__anact')
                    if (dw.ac._anact && !dw.ac.eventsIsEmpty()) {
                        return
                    }
                    if (dw.ac._anact_nohit_tag || dw.ac._anact) {
                        var unescaped = dw.ac._anact_nohit_tag
                            ? dw.ac._anact_nohit_tag
                            : dw.ac._anact
                        var jsonPayload = JSON.parse(unescaped)
                        if (jsonPayload) {
                            var payload = Array.isArray(jsonPayload) ? jsonPayload[0] : jsonPayload
                            if (
                                payload &&
                                'viewSearch' == payload.activityType &&
                                payload.parameters
                            ) {
                                var params = payload.parameters
                                var search_params = {}
                                search_params.q = params.searchText
                                search_params.suggestedSearchText = params.suggestedSearchText
                                search_params.persd = params.personalized
                                search_params.refs = params.refinements
                                search_params.sort = params.sorting_rule
                                search_params.imageUUID = params.image_uuid
                                search_params.showProducts = params.showProducts
                                search_params.searchID = params.searchID
                                search_params.locale = params.locale
                                search_params.queryLocale = params.queryLocale
                                dw.ac.applyContext({searchData: search_params})
                                var products = params.products
                                if (products && Array.isArray(products)) {
                                    for (var i = 0; i < products.length; i++) {
                                        if (products[i]) {
                                            dw.ac._capture({
                                                id: products[i].id,
                                                type: dw.ac.EV_PRD_SEARCHHIT
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            /************************************************************
             * Public data and methods
             ************************************************************/

            return {
                /*
                 * Get Tracker
                 */
                getTracker: function (analyticsUrl) {
                    return new Tracker(analyticsUrl)
                }
            }
        })()
    }
})(window.dw || {})
