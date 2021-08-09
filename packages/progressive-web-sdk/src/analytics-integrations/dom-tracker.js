/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {UIINTERACTION} from './types'
const DATA_NAME = 'data-analytics-name'
const DATA_CONTENT = 'data-analytics-content'

/**
 * A tracker registered with the Analytics Manager to track DOM events.
 *
 * @private
 */
export class DOMTracker {
    /**
     * @constructor
     *
     * @param {module:analytics-manager.AnalyticsManager} analytics The Analytics Manager.
     */
    constructor(analytics) {
        this.analytics = analytics
        this.rootEl = document.getElementsByClassName('react-target')[0]
        this.lastFocussedEl = null
        const events = ['focus', 'change', 'click']

        if (this.rootEl) {
            events.forEach((event) => {
                this.rootEl.addEventListener(event, this.onEvent.bind(this), {
                    capture: true,
                    passive: true
                })
            })
        }
    }

    /**
     * Get the relevant element defined with analytics attributes for the given event.
     *
     * @param {Event} event
     * @return {Element} null if event is not triggered on an element set up with analytics.
     * @private
     */
    getEventElement(event) {
        let el = event.target
        if (event.type !== 'click') {
            return el.hasAttribute(DATA_NAME) ? el : null
        }

        while (el && el instanceof Element) {
            if (el.hasAttribute(DATA_NAME)) {
                return el
            }
            el = el.parentNode
        }
        return null
    }

    /**
     * Collect analytics data for a given event.
     *
     * @param {Event} event a DOM Event.
     * @return {Object}
     */
    getTrackingData(event) {
        const action = event.type

        const element = this.getEventElement(event)

        if (!element) {
            return null
        }

        const type = element.type
        const nodeName = element.nodeName.toLowerCase()

        // Prevent duplicate focus events that happen when clicking outside the
        // browser and coming back to it.
        if (action === 'focus' && element === this.lastFocussedEl) {
            return null
        } else {
            this.lastFocussedEl = element
        }

        // checkbox and radio elements should only send a uiInteraction on the 'click' event, not the 'focus and change' events too.
        if (
            (action === 'focus' || action === 'change') &&
            (type === 'radio' || type === 'checkbox')
        ) {
            return null
        }

        let content

        const name = element.getAttribute(DATA_NAME)

        if (type === 'checkbox') {
            content = element.checked
        } else if (type === 'radio' || nodeName === 'select') {
            content = element.value
        } else {
            content = element.getAttribute(DATA_CONTENT)
        }

        return {
            type: UIINTERACTION,
            data: {
                subject: 'user',
                name,
                action,
                object: nodeName,
                ...(content ? {content} : {})
            }
        }
    }

    /**
     * An event handler to be registered with a DOM element that
     * collects analytics data and send it to the Analytics Manager.
     *
     * @param {Event} e
     * @returns {undefined}
     */
    onEvent(e) {
        const trackingData = this.getTrackingData(e)
        if (trackingData) {
            const {type, data} = trackingData
            this.analytics.track(type, data)
        }
    }
}
