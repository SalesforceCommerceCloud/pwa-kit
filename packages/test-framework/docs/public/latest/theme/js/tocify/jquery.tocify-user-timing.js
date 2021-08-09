;(function() {
    var timings = {}
    var activeTiming = null
    var page = null

    /**
     * Enters the elapsed duration in the `timings` object.
     * @param {String} id The unique ID of the timed item.
     * @param {Number} duration The number of elapsed milliseconds.
     */
    function recordTiming(id, duration) {
        if (id !== undefined) {
            timings[id] = duration + (timings[id] || 0)
        }
    }

    /**
     * Sets the "start" timestamp for the active item.
     */
    function startTiming() {
        if (activeTiming) {
            activeTiming.timestamp = Date.now()
        }
    }

    /**
     * Stops timing the active item and records the elapsed duration.
     */
    function stopTiming() {
        if (activeTiming) {
            // Compute the elapsed duration and reset the active item state.
            var id = activeTiming.id
            var duration = Date.now() - activeTiming.timestamp
            activeTiming = null

            // Record the elapsed duration for the timed item.
            recordTiming(id, duration)

            // In addition to individual item tracking, we also want to record
            // "global" active page durations.
            if (id !== '') {
                recordTiming('', duration)
            }
        }
    }

    /**
     * Configures this timing module to time the given element.
     * @param {JQuery} $el The table of contents item to time.
     */
    function switchTiming($el) {
        stopTiming()
        activeTiming = {id: $el.data('unique')}
        startTiming()
    }

    /**
     * Pushes all of the collected timing data up through the data layer to
     * Google Tag Manager.
     */
    function sendTimings() {
        // Get any last timing data.
        stopTiming()

        // Push each recorded timing to the data layer, so we can
        // record it with Google Analytics' User Timing API.
        for (var id in timings) {
            window.dataLayer.push({
                event: 'userTiming',
                attributes: {
                    heading: id || 'ENTIRE-PAGE',
                    duration: timings[id],
                    label: page
                }
            })
        }

        // Reset the timing state.
        timings = {}
        activeTiming = null
    }

    // Override parts of the `jquery.tocify` widget so we can invoke our own
    // timing functions.
    $.widget('toc.tocify', $.toc.tocify, {
        _clearToc: function() {
            // Remove the unordered list created during the generation process.
            this.element.children('ul').remove()

            // Clear all TOC items.
            this.items = []
        },

        _generateToc: function() {
            this._super()

            // Set the `href` attributes of each TOC link so the user can copy
            // the anchored URL just by right-clicking.
            this.element.find('li').each(function(_, el) {
                var $el = $(el)
                $el.children('a').attr('href', '#' + $el.data('unique'))
            })

            // Record the page URL. We'll use this in case the user is on a
            // virtual page. On `hashchange` events, the URL has already
            // changed to the new hash.
            var hash = window.location.hash
            page = window.location.pathname + (hash.startsWith('#!') ? hash : '')
        },

        _triggerShow: function($el) {
            switchTiming($el)
            return this._super($el)
        }
    })

    // Listen for `window` events to determine if the user is actually reading
    // the documentation content.
    $(window).on('blur focus visibilitychange', function(e) {
        if (this.document.visibilityState === 'visible' && e.type !== 'blur') {
            // If the user can see the document, start (or resume) timing the
            // active item.
            startTiming()
        } else {
            // Otherwise, the document is hidden.
            stopTiming()
        }
    })

    $(window).on('hashchange', function() {
        // Only send our timing data if we're viewing a virtual page, denoted
        // by a hashbang.
        if (window.location.hash.match(/^#!/)) {
            sendTimings()

            // Re-generate the table of contents.
            setTimeout(() => {
                var widget = $('#toc').data('toc-tocify')
                widget._clearToc()
                widget._generateToc()
                widget._addCSSClasses()
            }, 0)
        }
    })

    // Just before the user leaves the page, send the timing data we collected
    // to Google Analytics (via a custom GTM event).
    $(window).on('beforeunload', function() {
        sendTimings()
    })
})()
