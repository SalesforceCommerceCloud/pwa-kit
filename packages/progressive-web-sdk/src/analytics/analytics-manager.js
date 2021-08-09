/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from './connectors/connector'
import EngagementEngine from './connectors/engagement-engine/connector'
import MobifyGA from './connectors/google-analytics/mobify-ga'
import {hasUrlDebugFlag} from './utils'

import {
    EVENT_ACTION,
    UIInteraction,
    UI_SUBJECT,
    UI_ACTION,
    UI_OBJECT,
    UI_NAME,
    PERFORMANCE_METRICS
} from './data-objects'
import ttiPolyfill from 'tti-polyfill'

// The maximum number of characters that the column content in EE can store
const MAX_CONTENT_FIELD_LENGTH = 128

let bundle
let firstLoad = true
let performanceTiming = {}
let assetCount = 0
let delaySendPerformanceTimer

const normalizeTimingMetrics = (startTime, timings) => {
    const normalizedTiming = {}
    Object.keys(timings).forEach((key) => {
        const value = timings[key]
        if (typeof value === 'number') {
            normalizedTiming[key] = timings[key] - startTime
        } else {
            normalizedTiming[key] = timings[key]
        }
    })
    return normalizedTiming
}

const assertValidConnector = (connector) => {
    if (!(Object.getPrototypeOf(connector) instanceof Connector)) {
        throw new Error(`Analytics connector must be an instance of Connector`)
    }
}

const parseEvent = (type) => {
    const separatorIndex = type.indexOf('.')

    if (separatorIndex === -1) {
        return {type}
    } else {
        const connectorName = type.substr(0, separatorIndex)
        return {
            type: type.substr(separatorIndex + 1),
            connectorName
        }
    }
}

const EVENT_OPTIONS = {
    capture: true,
    passive: true
}
export const DATA_NAME = 'data-analytics-name'
export const DATA_CONTENT = 'data-analytics-content'
const DATA_TOUCHED = 'data-analytics-touched'
const NODE_NAMES = {
    input: 'INPUT',
    select: 'SELECT',
    textarea: 'TEXTAREA'
}

export const hasAnalyticsNameAttribute = (element, elementType, debugFlag) => {
    if (!element.hasAttribute(DATA_NAME)) {
        /* istanbul ignore else */
        if (debugFlag) {
            console.error(`${elementType} must have '${DATA_NAME}' attribute defined`, element)
        }
        return false
    }
    return true
}

const captureUIInteractions = (analyticsManager, element) => {
    /* istanbul ignore else */
    if (!hasAnalyticsNameAttribute(element, 'Element', analyticsManager.options.debug)) {
        return
    }

    const name = element.getAttribute(DATA_NAME)
    const content = element.getAttribute(DATA_CONTENT)
    const nodeName = element.nodeName

    const data = {
        [UIInteraction.SUBJECT]: UI_SUBJECT.user,
        [UIInteraction.NAME]: name
    }

    if (content) {
        data[UIInteraction.CONTENT] = content
    }

    if (
        nodeName === NODE_NAMES.input ||
        nodeName === NODE_NAMES.select ||
        nodeName === NODE_NAMES.textarea
    ) {
        data[UIInteraction.ACTION] = UI_ACTION.focus
        data[UIInteraction.OBJECT] = UI_OBJECT.input
        if (element.type === 'checkbox') {
            data[UIInteraction.CONTENT] = element.checked
        } else if (element.type === 'radio' || nodeName === NODE_NAMES.select) {
            data[UIInteraction.CONTENT] = element.value
        }
    } else {
        data[UIInteraction.ACTION] = UI_ACTION.click
        data[UIInteraction.OBJECT] = UI_OBJECT.element
    }

    analyticsManager.distribute(EVENT_ACTION.uiInteraction, new UIInteraction(data))
}

const captureEventsFromDOM = (analyticsManager) => {
    const rootEl = document.getElementsByClassName('react-target')[0]

    // User Interaction - Bind passive capture event listener on root element
    rootEl.addEventListener(
        'focus',
        (event) => {
            const element = event.target
            const nodeName = element.nodeName

            /* istanbul ignore else */
            if (
                !element.hasAttribute(DATA_TOUCHED) &&
                (NODE_NAMES.hasOwnProperty(nodeName.toLowerCase()) ||
                    element.hasAttribute(DATA_NAME))
            ) {
                if (
                    (nodeName === NODE_NAMES.input &&
                        !(element.type === 'radio' || element.type === 'checkbox')) ||
                    nodeName === NODE_NAMES.textarea
                ) {
                    captureUIInteractions(analyticsManager, element)
                } else {
                    element.setAttribute(DATA_TOUCHED, true)
                    element.addEventListener(
                        nodeName === NODE_NAMES.select ? 'change' : 'click',
                        () => {
                            captureUIInteractions(analyticsManager, element)
                        },
                        EVENT_OPTIONS
                    )
                }
            }
        },
        EVENT_OPTIONS
    )

    // Exposing Analytics constants on window.Progressive space
    /* istanbul ignore else */
    if (window.Progressive) {
        window.Progressive.analytics = {
            constants: {
                UI_SUBJECT,
                UI_ACTION,
                UI_OBJECT,
                UI_NAME
            }
        }

        // Exposing an analytics send function on window.Progressive space
        window.Progressive.analytics.send = (analyticsData) => {
            analyticsManager.distribute(
                EVENT_ACTION.uiInteraction,
                new UIInteraction(analyticsData, [], {
                    [UIInteraction.SUBJECT]: {
                        defaultValue: UI_SUBJECT.app
                    }
                })
            )
        }
    }
}

// This class is a singleton
class AnalyticsManager {
    constructor() {
        this.options = {
            debug: false
        }
    }

    init(initalizingOptions, ...otherConnectors) {
        this.options = {
            ...this.options,
            ...initalizingOptions
        }

        if (hasUrlDebugFlag()) {
            this.options.debug = true
        }

        this.engagementEngine = new EngagementEngine(this.options)

        this.connectors = [this.engagementEngine, new MobifyGA(this.options), ...otherConnectors]

        this.connectors.forEach((connector) => {
            assertValidConnector(connector)
            connector.options.debug = this.options.debug
        })

        const mainScript = document.querySelectorAll('#progressive-web-main')[0].src
        bundle = mainScript.indexOf('production') !== -1 ? 'production' : 'development'

        captureEventsFromDOM(this)
    }

    countAsset() {
        if (performanceTiming.templateWillMount && !performanceTiming.templateAPIEnd) {
            assetCount += 1
        }
    }

    checkAllAssetsLoaded() {
        /* istanbul ignore else */
        if (assetCount > 0) {
            assetCount -= 1
        }
    }

    sendPerformance() {
        // Prevents double send in case when the timeout and assets finish loading within the 1 second gap
        /* istanbul ignore else */
        if (performanceTiming.templateAPIEnd) {
            if (
                // When we have zero assets
                !performanceTiming.fullPageLoad ||
                // Or all assets are pre-cached so API comes back slower
                performanceTiming.fullPageLoad < performanceTiming.templateAPIEnd
            ) {
                performanceTiming.fullPageLoad = performanceTiming.templateAPIEnd
            }

            let startTime = window.Progressive.PerformanceTiming.timingStart

            if (!firstLoad) {
                startTime = performanceTiming.templateWillMount
            }

            const metrics = {
                bundle,
                ...normalizeTimingMetrics(startTime, performanceTiming),
                timingStart: startTime
            }

            if (firstLoad) {
                /* istanbul ignore next */
                ttiPolyfill.getFirstConsistentlyInteractive().then((timeToInteractive) => {
                    // Cannot unit test this promise as it requires PerformanceLongTaskTiming and PerformanceObserver
                    // and something else to work properly
                    /* istanbul ignore next */
                    this.distribute(EVENT_ACTION.performance, {
                        ...window.Progressive.PerformanceTiming,
                        ...metrics,
                        [PERFORMANCE_METRICS.timeToInteractive]: timeToInteractive
                    })
                })
            } else {
                this.distribute(EVENT_ACTION.performance, metrics)
            }

            firstLoad = false
            assetCount = 0
            performanceTiming = {}
        }
    }

    collectPerformance(type, value) {
        // This clears out any set values due to lazy loaded contents
        if (
            type !== PERFORMANCE_METRICS.templateWillMount &&
            !performanceTiming.templateWillMount
        ) {
            performanceTiming = {}
            assetCount = 0
            return
        }

        if (type === PERFORMANCE_METRICS.fullPageLoad) {
            this.checkAllAssetsLoaded()
        }

        const timing = Date.now()

        performanceTiming[type] = value || timing

        if (
            performanceTiming.templateWillMount &&
            performanceTiming.templateDidMount &&
            performanceTiming.templateAPIEnd
        ) {
            if (assetCount === 0) {
                this.sendPerformance()
            } else {
                // We are waiting for assets to finish loading but we don't wait for
                // any resources that are lazy loaded by user interaction
                clearTimeout(delaySendPerformanceTimer)
                delaySendPerformanceTimer = setTimeout(() => {
                    this.sendPerformance()
                }, 1000)
            }
        }
    }

    distribute(event, metaPayload, state) {
        const {type, connectorName} = parseEvent(event)

        if (!type) {
            return
        }

        /* istanbul ignore else */
        if (this.connectors) {
            this.connectors.forEach((connector) => {
                try {
                    if (connectorName && connectorName === connector.name) {
                        connector.receive(type, metaPayload, state)
                    } else if (typeof connectorName === 'undefined') {
                        connector.receive(type, metaPayload, state)
                    }
                } catch (err) {
                    console.error(
                        `Analytics connector ${connector.displayName} failed to execute ${type} analytics`,
                        err
                    )
                    this.engagementEngine.receive(
                        EVENT_ACTION.uiInteraction,
                        new UIInteraction({
                            [UIInteraction.SUBJECT]: UI_SUBJECT.app,
                            [UIInteraction.ACTION]: UI_ACTION.receive,
                            [UIInteraction.OBJECT]: UI_OBJECT.error,
                            [UIInteraction.NAME]: `Analytics Connector Error: ${connector.displayName} - ${type}`,
                            [UIInteraction.CONTENT]: err.stack
                                ? err.stack.substr(0, MAX_CONTENT_FIELD_LENGTH)
                                : err.toString().substr(0, MAX_CONTENT_FIELD_LENGTH)
                        })
                    )
                }
            })
        }
    }

    addConnector(connector) {
        assertValidConnector(connector)
        connector.debug = this.options.debug
        this.connectors = [...this.connectors, connector]
    }
}
const analyticsManager = new AnalyticsManager()

export default analyticsManager
