/*!
* dwAnalytics - Web Analytics Tracking
* Based partially on Piwik
*
* @link http://piwik.org
* @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
*/

// Create dw namespace if necessary
if (typeof dw == 'undefined') {
    var dw = {};
}

if (typeof dw.__dwAnalyticsLoaded ==  'undefined')
{
    dw.__dwAnalyticsLoaded = true;

    // DWAnalytics singleton and namespace
    dw.__dwAnalytics = function () {
        /************************************************************
         * Private data
         ************************************************************/

        var MAX_URL_LENGTH = 2000;

        var expireDateTime,

            /* plugins */
            plugins = {},

            /* alias frequently used globals for added minification */
            documentAlias = document,
            navigatorAlias = navigator,
            screenAlias = screen,
            windowAlias = window,
            hostnameAlias = windowAlias.location.hostname;

        /************************************************************
         * Private methods
         ************************************************************/

        /*
         * Is property (or variable) defined?
         */
        function isDefined(property) {
            return typeof property !== 'undefined';
        }

        /*
         * DWAnalytics Tracker class
         *
         * trackerUrl and trackerSiteId are optional arguments to the constructor
         *
         * See: Tracker.setTrackerUrl() and Tracker.setSiteId()
         */
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
                    pdf:         ['pdf',   'application/pdf',               '0'],
                    // media players
                    quicktime:   ['qt',    'video/quicktime',               '0'],
                    realplayer:  ['realp', 'audio/x-pn-realaudio-plugin',   '0'],
                    wma:         ['wma',   'application/x-mplayer2',        '0'],
                    // interactive multimedia
                    director:    ['dir',   'application/x-director',        '0'],
                    flash:       ['fla',   'application/x-shockwave-flash', '0'],
                    // RIA
                    java:        ['java',  'application/x-java-vm',         '0'],
                    gears:       ['gears', 'application/x-googlegears',     '0'],
                    silverlight: ['ag',    'application/x-silverlight',     '0']
                },

                // Guard against installing the link tracker more than once per Tracker instance
                linkTrackingInstalled = false,

                /*
                 * encode or escape
                 * - encodeURIComponent added in IE5.5
                 */
                escapeWrapper = windowAlias.encodeURIComponent || escape,

                /*
                 * decode or unescape
                 * - decodeURIComponent added in IE5.5
                 */
                unescapeWrapper = windowAlias.decodeURIComponent || unescape,

                /*
                 * registered (user-defined) hooks
                 */
                registeredHooks = {};

            /*
             * Set cookie value
             */
            function setCookie(cookieName, value, daysToExpire, path, domain, secure) {
                var expiryDate;

                if (daysToExpire) {
                    // time is in milliseconds
                    expiryDate = new Date();
                    // there are 1000 * 60 * 60 * 24 milliseconds in a day (i.e., 86400000 or 8.64e7)
                    expiryDate.setTime(expiryDate.getTime() + daysToExpire * 8.64e7);
                }

                documentAlias.cookie = cookieName + '=' + escapeWrapper(value) +
                    (daysToExpire ? ';expires=' + expiryDate.toGMTString() : '') +
                    ';path=' + (path ? path : '/') +
                    (domain ? ';domain=' + domain : '') +
                    (secure ? ';secure' : '');
            }

            /*
             * Get cookie value
             */
            function getCookie(cookieName) {
                var cookiePattern = new RegExp('(^|;)[ ]*' + cookieName + '=([^;]*)'),

                    cookieMatch = cookiePattern.exec(documentAlias.cookie);

                return cookieMatch ? unescapeWrapper(cookieMatch[2]) : 0;
            }

            /*
             * Send image request to DWAnalytics server using GET.
             * The infamous web bug is a transparent, single pixel (1x1) image
             * Async with a delay of 100ms.
             */
            function getImage(urls) {
                dw.__timeoutCallback = function()
                {
                    for (var i = 0; i < urls.length; i++)
                    {
                        var image = new Image(1, 1);
                        image.onLoad = function () {};
                        image.src = urls[i];
                    }
                };
                setTimeout(dw.__timeoutCallback, 100);
            }

            /*
             * Browser plugin tests
             */
            function detectBrowserPlugins() {
                var i, mimeType;

                // Safari and Opera
                // IE6: typeof navigator.javaEnabled == 'unknown'
                if (typeof navigatorAlias.javaEnabled !== 'undefined' && navigatorAlias.javaEnabled()) {
                    pluginMap.java[2] = '1';
                }

                // Firefox
                if (typeof windowAlias.GearsFactory === 'function') {
                    pluginMap.gears[2] = '1';
                }

                if (navigatorAlias.mimeTypes && navigatorAlias.mimeTypes.length) {
                    for (i in pluginMap) {
                        mimeType = navigatorAlias.mimeTypes[pluginMap[i][1]];
                        if (mimeType && mimeType.enabledPlugin) {
                            pluginMap[i][2] = '1';
                        }
                    }
                }
            }

            /*
             * Get page referrer
             */
            function getReferrer() {
                var referrer = '';
                try {
                    referrer = top.document.referrer;
                } catch (e) {
                    if (parent) {
                        try {
                            referrer = parent.document.referrer;
                        } catch (e2) {
                            referrer = '';
                        }
                    }
                }
                if (referrer === '') {
                    referrer = documentAlias.referrer;
                }

                return referrer;
            }

            /*
             * Does browser have cookies enabled (for this site)?
             */
            function hasCookies() {
                var testCookieName = '_pk_testcookie';
                if (!isDefined(navigatorAlias.cookieEnabled)) {
                    setCookie(testCookieName, '1');
                    return getCookie(testCookieName) == '1' ? '1' : '0';
                }

                return navigatorAlias.cookieEnabled ? '1' : '0';
            }

            /*
             * Log the page view / visit
             */
            function logPageView(analyticsContext, collectedData, customTitle) {
                var id = Math.random();

                var tuples = constructDataSet(analyticsContext, collectedData, customTitle, id);

                if (collectedData != null && collectedData.debugEnabled) {
                    var text = '';
                    for (var i = 0; i < tuples.length; i++)
                    {
                        text += tuples[i][0] + '"=' + tuples[i][1] + '"\n';
                    }
                    alert(text);
                }


                var urls = createUrls(analyticsContext, configTrackerUrl, tuples, id);
                getImage(urls);
            }

            /************************************************************
             * Constructor
             ************************************************************/

            /*
             * initialize tracker
             */
            pageReferrer = getReferrer();
            browserHasCookies = hasCookies();
            detectBrowserPlugins();

            try {
                process_anact_cookie();
            } catch (err) {};

            /************************************************************
             * Public data and methods
             ************************************************************/

            return {
                /*
                 * Log visit to this page  (called from the bottom of the page).
                 */
                trackPageView: function (customTitle) {
                    logPageView(null, null, customTitle);
                },
                /*
                 * Log visit to this page (called from the dwac script).
                 */
                trackPageViewWithProducts: function (analyticsContext, collectedData, customTitle) {
                    logPageView(analyticsContext, collectedData, customTitle);
                }
            };


            function appendToRequest(/*Array*/ tuple, /*string*/ request) {

                var beginningChar = request.charAt(request.length - 1) == '?' ? '' : '&';
                return request + beginningChar + tuple[0] + "=" + tuple[1];
            }

            function lengthOfTuple(/*Array*/ tuple) {
                return tuple[0].length + tuple[1].length + 2;
            }

            function constructDataSet(/*object*/ analyticsContext, collectedData, /*string*/ customTitle, /*number*/ id) {
                var tuples = [
                    ["url", escapeWrapper(isDefined(configCustomUrl) ? configCustomUrl : documentAlias.location.href)],
                    ["res", screenAlias.width + 'x' + screenAlias.height],
                    ["cookie", browserHasCookies],
                    ["ref", escapeWrapper(pageReferrer)],
                    ["title", escapeWrapper(isDefined(customTitle) && customTitle != null ? customTitle : configTitle)]
                ];

                // plugin data
                for (var index in pluginMap) {
                    tuples.push([pluginMap[index][0], pluginMap[index][2]])
                }

                if (analyticsContext != null && analyticsContext.dwEnabled)
                {
                    tuples.push(["dwac", id]);
                    tuples.push(["cmpn", analyticsContext.sourceCode]);
                    tuples.push(["tz", analyticsContext.timeZone]);

                    analyticsContext.category = dw.ac._category;
                    if (dw.ac._searchData) {
                        analyticsContext.searchData = dw.ac._searchData;
                    }

                    addProducts(analyticsContext, collectedData, tuples);
                }

                return tuples;
            }

            function addProducts(/*object*/ analyticsContext, /*object*/ collectedData, /*Array*/ tuples)
            {
                tuples.push(["pcc", analyticsContext.siteCurrency]);
                tuples.push(["pct", analyticsContext.customer]);
                tuples.push(["pcat", analyticsContext.category]);
                if (analyticsContext.searchData) {
                    if (analyticsContext.searchData.q) tuples.push(["pst-q", analyticsContext.searchData.q]);
                    if (analyticsContext.searchData.searchID) tuples.push(["pst-id", analyticsContext.searchData.searchID]);
                    if (analyticsContext.searchData.refs) tuples.push(["pst-refs", analyticsContext.searchData.refs]);
                    if (analyticsContext.searchData.sort) tuples.push(["pst-sort", analyticsContext.searchData.sort]);
                    if (undefined != analyticsContext.searchData.persd) tuples.push(["pst-pers", analyticsContext.searchData.persd]);
                    if (analyticsContext.searchData.imageUUID) tuples.push(["pst-img", analyticsContext.searchData.imageUUID]);
                    if (analyticsContext.searchData.suggestedSearchText) tuples.push(["pst-sug", analyticsContext.searchData.suggestedSearchText]);
                    if (analyticsContext.searchData.locale) tuples.push(["pst-loc", analyticsContext.searchData.locale]);
                    if (analyticsContext.searchData.queryLocale) tuples.push(["pst-qloc", analyticsContext.searchData.queryLocale]);
                    if (undefined != analyticsContext.searchData.showProducts) tuples.push(["pst-show", analyticsContext.searchData.showProducts]);
                }

                var pies = collectedData.productImpressions.getEntries();
                var pres = collectedData.productRecommendations.getEntries();
                var pves = collectedData.productViews.getEntries();

                var count = 0;
                for (var i = 0; i < pies.length; i++) {
                    tuples.push([("pid-" + count), pies[i].value.id]);
                    tuples.push([("pev-" + count), "event3"]);
                    count++;
                }

                for (var j = 0; j < pres.length; j++) {
                    tuples.push([("pid-" + count), pres[j].value.id]);
                    tuples.push([("pev-" + count), "event3"]);
                    tuples.push([("evr4-" + count), 'Yes']);
                    count++;
                }

                for (var k = 0; k < pves.length; k++) {
                    tuples.push([("pid-" + count), pves[k].value.id]);
                    tuples.push([("pev-" + count), "event4"]);
                    count++;
                }
            }

            function createUrls(analyticsContext, configTrackerUrl, tuples, id) {
                var urls = [];
                var request = configTrackerUrl;
                for (var i = 0; i < tuples.length; i++) {
                    // we don't want to break up a product grouping, for example,
                    // ["pid-0","p1"],["pev-0","event3"],["evr4-0",'Yes'] should not be broken into two separate requests
                    var nextTupleIsProductAndWouldMakeRequestTooLong = (tuples[i][0].slice(0, "pid-".length) == "pid-")
                        && (lengthOfTuple(tuples[i])
                            + ((i + 1) < tuples.length ? lengthOfTuple(tuples[i + 1]) : 0)
                            + ((i + 2) < tuples.length ? lengthOfTuple(tuples[i + 2]) : 0)
                            + request.length > MAX_URL_LENGTH);

                    var nextTupleIsNotProductAndWouldMakeRequestTooLong = (tuples[i][0].slice(0, "pid-".length) != "pid-")
                        && (lengthOfTuple(tuples[i]) + request.length > MAX_URL_LENGTH);

                    if (nextTupleIsProductAndWouldMakeRequestTooLong || nextTupleIsNotProductAndWouldMakeRequestTooLong) {
                        urls.push(request);
                        // close the current request and create a new one,
                        // the new request should have the basic dwac, cmpn,tz, pcc, pct, pcat values
                        request = appendToRequest(["dwac", id], configTrackerUrl);
                        if (analyticsContext != null && analyticsContext.dwEnabled) {
                            request = appendToRequest(["cmpn", analyticsContext.sourceCode], request);
                            request = appendToRequest(["tz", analyticsContext.timeZone], request);
                            request = appendToRequest(["pcc", analyticsContext.siteCurrency], request);
                            request = appendToRequest(["pct", analyticsContext.customer], request);
                            request = appendToRequest(["pcat", analyticsContext.category], request);
                            if (analyticsContext.searchData) {
                                if (analyticsContext.searchData.q) appendToRequest(["pst-q", analyticsContext.searchData.q], request);
                                if (analyticsContext.searchData.searchID) appendToRequest(["pst-id", analyticsContext.searchData.searchID], request);
                                if (analyticsContext.searchData.refs) appendToRequest(["pst-refs", JSON.stringify(analyticsContext.searchData.refs)], request);
                                if (analyticsContext.searchData.sort) appendToRequest(["pst-sort", JSON.stringify(analyticsContext.searchData.sort)], request);
                                if (undefined != analyticsContext.searchData.persd) appendToRequest(["pst-pers", analyticsContext.searchData.persd], request);
                                if (analyticsContext.searchData.imageUUID) appendToRequest(["pst-img", analyticsContext.searchData.imageUUID], request);
                                if (analyticsContext.searchData.suggestedSearchText) appendToRequest(["pst-sug", analyticsContext.searchData.suggestedSearchText], request);
                                if (analyticsContext.searchData.locale) appendToRequest(["pst-loc", analyticsContext.searchData.locale], request);
                                if (analyticsContext.searchData.queryLocale) appendToRequest(["pst-qloc", analyticsContext.searchData.queryLocale], request);
                                if (undefined != analyticsContext.searchData.showProducts) appendToRequest(["pst-show", analyticsContext.searchData.showProducts], request);
                            }
                        }
                    }

                    request = appendToRequest(tuples[i], request);
                }

                // Add the "do not follow" cookie in the URL as a query param
                // The cookie is set per-site, and gets applied to all sub-sites, if present
                var doNotFollowCookieValue = getCookie('dw_dnt');

                // If cookie not found
                if (doNotFollowCookieValue === 0
                    || doNotFollowCookieValue === ''
                    || doNotFollowCookieValue === null
                    || doNotFollowCookieValue === false) {
                    // do nothing, meaning tracking is allowed
                }
                // Cookie found, i.e. value should be '0' or '1' (string values)
                else {
                    // Set whatever the cookie value is
                    request = appendToRequest([ "dw_dnt", doNotFollowCookieValue ], request);
                }

                urls.push(request);
                return urls;
            }
        }

        function extractCookieValueAndRemoveCookie(cookieName) {
            var cookieValue = extractEncodedCookieValue (cookieName);
            if (cookieValue) {
                document.cookie = cookieName + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            }
            return cookieValue;
        };

        function extractEncodedCookieValue (cookieName) {
            return decodeURIComponent (
                document.cookie.replace(
                    new RegExp('(?:(?:^|.*;)\\s*'
                        + encodeURIComponent(cookieName).replace(/[\-\.\+\*]/g, '\\$&')
                        + '\\s*\\=\\s*([^;]*).*$)|^.*$')
                    , '$1').replace(/\+/g, '%20')
            ) || null;
        }

        function process_anact_cookie() {
            if (dw.ac) {
                dw.ac._anact=extractCookieValueAndRemoveCookie('__anact');
                if ( dw.ac._anact && !dw.ac.eventsIsEmpty() ) {
                    return;
                }
                if ( dw.ac._anact_nohit_tag || dw.ac._anact ) {
                    var unescaped = dw.ac._anact_nohit_tag ? dw.ac._anact_nohit_tag : dw.ac._anact;
                    var jsonPayload = JSON.parse(unescaped);
                    if (jsonPayload) {
                        var payload = Array.isArray(jsonPayload) ? jsonPayload[0] : jsonPayload;
                        if (payload
                            && 'viewSearch' == payload.activityType
                            && payload.parameters) {
                            var params = payload.parameters;
                            var search_params = {};
                            search_params.q = params.searchText;
                            search_params.suggestedSearchText = params.suggestedSearchText;
                            search_params.persd = params.personalized;
                            search_params.refs = params.refinements;
                            search_params.sort = params.sorting_rule;
                            search_params.imageUUID = params.image_uuid;
                            search_params.showProducts = params.showProducts;
                            search_params.searchID = params.searchID;
                            search_params.locale = params.locale;
                            search_params.queryLocale = params.queryLocale;
                            dw.ac.applyContext({searchData: search_params});
                            var products = params.products;
                            if (products && Array.isArray(products)) {
                                for (i = 0; i < products.length; i++) {
                                    if (products[i]) {
                                        dw.ac._capture({ id : products[i].id, type : dw.ac.EV_PRD_SEARCHHIT });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        /************************************************************
         * Public data and methods
         ************************************************************/

        return {
            /*
             * Get Tracker
             */
            getTracker: function (analyticsUrl) {
                return new Tracker(analyticsUrl);
            }
        };
    }();
}