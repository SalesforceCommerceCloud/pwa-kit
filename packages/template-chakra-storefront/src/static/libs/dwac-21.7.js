// Enhance the dw.ac namespace
(function(dw) {
    if (typeof dw.ac === "undefined") {
        return; // don't do anything if there was no <isactivedatahead> tag, that would create the ac namespace.
    }
    // Returns the value of the first cookie found whose name is accepted by the given function
    function getCookieValue(/*function(x)*/ acceptFunction) {
        var cookiePairs = document.cookie.split(';');
        for (var i = 0; i < cookiePairs.length; i++)
        {
            var index = cookiePairs[i].indexOf('=');
            if (index != -1) {
                var name = trim(cookiePairs[i].substring(0, index));
                if (acceptFunction(name)) {
                    return trim(unescape(cookiePairs[i].substring(index + 1)));
                }
            }
        }

        return null;
    };

    // trims a string, replacing the jquery.trim
    function trim(/*string*/value) {
        return value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    // Sets a cookie with the given name and value
    function setCookieValue(/*string*/ name, /*string*/ value, /*integer*/ millisToExpiry) {
        var cookie = name + '=' + escape(value) + ';path=/';
        if (millisToExpiry != -1) {
            cookie += ";expires=" + expires.toGMTString();
        }
        document.cookie = cookie;
    };

    // URL encodes the given string to match the Java URLEncoder class
    function urlencode(/*string*/ value) {
        var convertByte = function(code) {
            if(code < 32) {
                //numbers lower than 32 are control chars, not printable
                return '';
            } else {
                return '%' + new Number(code).toString(16).toUpperCase();
            }
        };

        var encoded = '';
        for (var i = 0; i < value.length; i++) {
            var c = value.charCodeAt(i);
            if (((c >= 97) && (c <= 122)) || ((c >= 65) && (c <= 90)) || ((c >= 48) && (c <= 57)) || (c == 46) || (c == 45) || (c == 42) || (c == 95)) {
                encoded += value.charAt(i);		// a-z A-z 0-9 . - * _
            }
            else if (c == 32) {
                encoded += '+';					// (space)
            }
            else if (c < 128) {
                encoded += convertByte(c);
            }
            else if ((c >= 128) && (c < 2048)) {
                encoded += convertByte((c >> 6) | 0xC0);
                encoded += convertByte((c & 0x3F) | 0x80);
            }
            else if ((c >= 2048) && (c < 65536)) {
                encoded += convertByte((c >> 12) | 0xE0);
                encoded += convertByte(((c >> 6) & 0x3F) | 0x80);
                encoded += convertByte((c & 0x3F) | 0x80);
            }
            else if (c >= 65536) {
                encoded += convertByte((c >> 18) | 0xF0);
                encoded += convertByte(((c >> 12) & 0x3F) | 0x80);
                encoded += convertByte(((c >> 6) & 0x3F) | 0x80);
                encoded += convertByte((c & 0x3F) | 0x80);
            }
        }

        return encoded;
    }

    // Returns the value of the analytics cookie set on the server
    function getAnalyticsCookieValue() {
        var acceptFunction = function(name) {
            return (name.length > 5) && (name.substring(0, 5) === 'dwac_');
        };
        return getCookieValue(acceptFunction);
    };

    // Contextual information retrieved from the server
    var analyticsContext = (function() {
        if (dw.ac._analytics_enabled === "false") {
            return {
                enabled: false,
                dwEnabled: false
            };
        }
        var cookieValue = getAnalyticsCookieValue();
        if (cookieValue == null) {
            return {
                visitorID: '__ANNONYMOUS__',
                customer: '__ANNONYMOUS__',
                siteCurrency: '',
                sourceCode: '',
                enabled: "true",
                timeZone: dw.ac._timeZone,
                dwEnabled: "true",
                encoding: 'ISO-8859-1'
            };
        }

        var tokens = cookieValue.split('|');

        return {
            visitorID: tokens[0],
            repository: tokens[1],
            customer: tokens[2],
            sourceCode: tokens[3],
            siteCurrency: tokens[4],
            enabled: tokens[5] == "true",
            timeZone: tokens[6],
            dwEnabled: tokens[7] == "true",
            encoding: 'ISO-8859-1'
        };
    }());

    // Turn debugging on or off
    var setDebugEnabled = function(enabled) {
        if (typeof enabled != 'boolean') {
            return;
        }

        setCookieValue('dwacdebug', '' + enabled, -1);
    };

    // Returns true if debug is enabled, false otherwise
    function isDebugEnabled() {
        var acceptFunction = function(name) {
            return name === 'dwacdebug';
        };
        return getCookieValue(acceptFunction) === 'true';
    };

    // Map data structure
    function Map() {
        var data = [];

        // Returns an array containing the entries in this map
        this.getEntries = function() {
            return data;
        };

        // Puts the given value in this map under the given key
        this.put = function(/*object*/ key, /*object*/ value) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].key == key) {
                    data[i].value = value;
                    return;
                }
            }

            data.push({key: key, value: value});
        };

        // Puts all the key value pairs in the given map into this map
        this.putAll = function(/*Map*/ map) {
            var entries = map.getEntries();
            for (var i = 0; i < entries.length; i++) {
                this.put(entries[i].key, entries[i].value);
            }
        };

        // Returns the value in this map under the given key, or null if there is no such value
        this.get = function(/*object*/ key) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].key == key) {
                    return data[i].value;
                }
            }

            return null;
        };

        // Clears this map of entries
        this.clear = function() {
            data.length = 0;
        };

        // Returns if this map is empty of values
        this.isEmpty = function() {
            return data.length == 0;
        }
    };

    // Delay in milliseconds before actually submitting data once some is ready
    var SUBMIT_DELAY_MILLIS = 500;

    // Set when the DOM is ready
    var domReady = false;

    // Timeout to submit data after a delay
    var submitTimeout = null;

    // Product impressions found on the page
    var productImpressions = new Map();

    // Product views found on the page
    var productViews = new Map();

    // Product recommendations found on the page
    var productRecommendations = new Map();

    // Applies values from the given source for fields defined in the given target
    function applyFields(/*object*/ source, /*object*/ target) {
        for (e in target) {
            if (typeof source[e] != 'undefined') {
                target[e] = source[e];
            }
        }
        return target;
    };

    // Collects the given product impression, and returns true if it is valid or false if it is not
    var collectProductImpression = function(/*object*/ configs) {
        if (typeof configs != 'object') {
            return false;
        }

        var pi = applyFields(configs, {id:null});

        // Quit if no SKU provided or is invalid
        if (typeof pi.id != 'string') {
            return false;
        }

        // Throw out the impression if SKU already seen
        var previousImpression = productImpressions.get(pi.id);
        if (previousImpression != null) {
            return false;
        }

        productImpressions.put(pi.id, pi);
        return true;
    };

    // Collects the given product recommendation, and returns true if it is valid or false if it is not
    var collectProductRecommendation = function(/*object*/ configs) {
        if (typeof configs != 'object') {
            return false;
        }

        var pr = applyFields(configs, {id:null});

        // Quit if no SKU provided or is invalid
        if (typeof pr.id != 'string') {
            return false;
        }

        // Throw out the recommendation if SKU already seen
        var previousRecommendation = productRecommendations.get(pr.id);
        if (previousRecommendation != null) {
            return false;
        }

        productRecommendations.put(pr.id, pr);
        return true;
    };

    // Collects the given product view, and returns true if it is valid or false if it is not
    var collectProductView = function(/*object*/ configs) {
        if (typeof configs != 'object') {
            return false;
        }

        var pv = applyFields(configs, {id:null});

        // Quit if no SKU provided or is invalid
        if (typeof pv.id != 'string') {
            return false;
        }

        // Throw out the view if SKU already seen
        var previousView = productViews.get(pv.id);
        if (previousView != null) {
            return false;
        }

        productViews.put(pv.id, pv);
        return true;
    };

    // Returns a new Map with the same contents as the given Map,
    // clearing the given Map in the process
    function copyAndClearMap(/*Map*/ map) {
        var copy = new Map();
        copy.putAll(map);
        map.clear();
        return copy;
    }

    // Returns if there are collected data to submit
    function containsProductDataToSubmit() {
        return !productImpressions.isEmpty() || !productRecommendations.isEmpty()
            || !productViews.isEmpty();
    }

    // Performs the actual submission of collected data for analytics processing
    var performDataSubmission = function() {

        if (dw.ac._analytics != null)
        {
            var collectedData = {
                pageInfo: dw.ac._category,
                productImpressions: productImpressions,
                productViews: productViews,
                productRecommendations: productRecommendations,
                debugEnabled: isDebugEnabled()
            };
            dw.ac._analytics.trackPageViewWithProducts(analyticsContext, collectedData, null);
            productImpressions.clear();
            productViews.clear();
            productRecommendations.clear();
            dw.ac._events.length = 0;
        }
    };

    // Submits the collected data for analytics processing after a short delay
    function submitCollectedData() {
        // don't submit the data before dom is ready, the data is still collected,
        // when dom is ready, the onDocumentReady method will call this method again.
        if(!domReady) {
            return;
        }

        if (submitTimeout) {
            clearTimeout(submitTimeout);
        }

        submitTimeout = setTimeout(performDataSubmission, SUBMIT_DELAY_MILLIS);
    }

    // Returns an object with the same properties as the given object, but with string type properties
    // in the given array of names set to the URL encoded form of their values using the escape function
    function escapeProperties(/*object*/ o, /*Array*/ props) {
        if (typeof o == 'undefined') {
            return;
        }

        var copy = {};
        for (e in o) {
            var escapeProp = false;
            for (var i = 0; (i < props.length) && !escapeProp; i++) {
                var prop = props[i];
                if ((e === prop) && (typeof o[prop] == 'string')) {
                    escapeProp = true;
                }
            }

            copy[e] = escapeProp ? urlencode(o[e]) : o[e];
        }

        return copy;
    }

    // Captures the given object data collected in subsequent events on the page,
    // and returns true if the given object data is valid, or returns false if not
    function captureObject(/*object*/ configs) {
        if (typeof configs != 'object') {
            return false;
        }

        if ((configs.type === dw.ac.EV_PRD_SEARCHHIT) || (configs.type === dw.ac.EV_PRD_SETPRODUCT)) {
            return collectProductImpression(escapeProperties(configs, ['id']));
        }

        if (configs.type === dw.ac.EV_PRD_DETAIL) {
            return collectProductView(escapeProperties(configs, ['id']));
        }

        if (configs.type === dw.ac.EV_PRD_RECOMMENDATION) {
            return collectProductRecommendation(escapeProperties(configs, ['id']));
        }

        return false;
    }

    // Captures the given data collected in subsequent events on the page
    function captureAndSend(/*object*/ configs) {
        if (typeof configs == 'undefined') {
            return;
        }

        // Support both array and single object cases
        if (typeof configs === 'object') {
            if (configs instanceof Array) {
                for (var i = 0; i < configs.length; i++) {
                    captureObject(configs[i]);
                }
            }
            else {
                if (configs[0] instanceof Object) {
                    captureObject(configs[0]);
                }
                else {
                    captureObject(configs);
                }
            }
        }

        // Submit captured data if appropriate
        if (domReady) {
            submitCollectedData();
        }
    };

    // Enhance existing capture function with submission step
    dw.ac.capture = captureAndSend;

    // expose debug API
    dw.ac.setDebugEnabled = setDebugEnabled;

    dw.ac._handleCollectedData = function () {
        domReady = false;
        dw.ac._events.forEach(captureAndSend);
        domReady = true;
        submitCollectedData();
    };

    dw.ac._scheduleDataSubmission = function () {
        if (dw.ac._submitTimeout) {
            clearTimeout(dw.ac._submitTimeout);
        }
        dw.ac._submitTimeout = setTimeout(dw.ac._handleCollectedData, 500);
    };

    // Added specifically for PWA kit to set currency for Analytics Context
    dw.ac._setSiteCurrency = function setSiteCurrency(currency) {
        analyticsContext.siteCurrency = currency;
    };

    // replace jQuery.ready() function
    (function onDocumentReady(callback) {
        // Catch cases where $(document).ready() is called after the browser event has already occurred.
        if (document.readyState === "complete") {
            // Handle it asynchronously to allow scripts the opportunity to delay ready
            setTimeout(callback, 1);
        }

        // Mozilla, Opera and webkit nightlies currently support this event
        if (document.addEventListener) {
            DOMContentLoaded = function() {
                document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
                callback();
            };
            // Use the handy event callback
            document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
            // A fallback to window.onload, that will always work
            window.addEventListener("load", callback, false);
            // If IE event model is used
        } else if (document.attachEvent) {
            DOMContentLoaded = function() {
                // Make sure body exists, at least, in case IE gets a little overzealous
                if (document.readyState === "complete") {
                    document.detachEvent("onreadystatechange", DOMContentLoaded);
                    callback();
                }
            };
            // ensure firing before onload, maybe late but safe also for iframes
            document.attachEvent("onreadystatechange", DOMContentLoaded);

            // A fallback to window.onload, that will always work
            window.attachEvent("onload", callback);
        }
    })(function() {
        dw.ac._handleCollectedData();
    });
}((window.dw||{})));