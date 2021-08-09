/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {AnalyticsManager} from './analytics-manager'
import {DOMTracker} from './dom-tracker'
import {UIINTERACTION} from './types'

class Connector {
    load() {
        return Promise.resolve()
    }

    track(type, data) {
        return data
    }
}

const dispatchEvent = (el, eventName) => {
    const event = new MouseEvent(eventName, {
        view: window,
        bubbles: true,
        cancelable: true
    })

    el.dispatchEvent(event)
}

const createElement = (analyticsName, nodeName, type, value, analyticsContent) => {
    const el = document.createElement(nodeName)

    if (analyticsName) el.setAttribute('data-analytics-name', analyticsName)
    if (analyticsContent) el.setAttribute('data-analytics-content', analyticsContent)
    if (type) el.type = type
    if (value) el.value = value

    document.getElementsByClassName('react-target')[0].appendChild(el)
    return el
}

test('Dummy tracker instantiated when no document react-target element', () => {
    const connector = new Connector()
    connector.load = jest.fn(() => {
        return Promise.resolve()
    })
    const am = new AnalyticsManager({
        connectors: [connector]
    })
    expect(am.domTracker).toBeInstanceOf(DOMTracker)
    const dt = am.domTracker
    expect(dt.analytics).toBe(am)
    expect(dt.rootEl).toBeUndefined()
})

describe('DOM Tracker ', () => {
    let am
    let reactRoot
    let reactRootAddEventListenerSpy
    beforeEach(() => {
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        window.Progressive = {}

        if (document.getElementsByClassName('react-target').length !== 0) {
            document.body.removeChild(document.getElementsByClassName('react-target')[0])
        }

        // Build react-target DOM element
        reactRoot = document.createElement('div')
        reactRoot.className = 'react-target'
        document.body.appendChild(reactRoot)
        reactRootAddEventListenerSpy = jest.spyOn(reactRoot, 'addEventListener')

        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        scriptel.src = '/test.js'
        document.body.appendChild(scriptel)

        const connector = new Connector()
        connector.load = jest.fn(() => {
            return Promise.resolve()
        })
        am = new AnalyticsManager({
            connectors: [connector]
        })
    })
    test('Tracker is instantiated with Analytics Manager', () => {
        expect(am.domTracker).toBeInstanceOf(DOMTracker)
        const dt = am.domTracker
        expect(dt.analytics).toBe(am)
        expect(dt.rootEl).toBe(reactRoot)
        expect(reactRootAddEventListenerSpy).toHaveBeenCalledTimes(3)
        expect(reactRootAddEventListenerSpy.mock.calls[0][0]).toBe('focus')
        expect(reactRootAddEventListenerSpy.mock.calls[1][0]).toBe('change')
        expect(reactRootAddEventListenerSpy.mock.calls[2][0]).toBe('click')
    })

    test('onEvent() calls getTrackingData(). If tracking data is returned, track it', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        dt.getTrackingData = jest.fn(() => 'mock')

        dt.onEvent({event: 'mock'})
        expect(dt.getTrackingData).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
    })

    test('onEvent() calls getTrackingData(). If tracking data is not returned, nothing to track', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        dt.getTrackingData = jest.fn(() => null)

        dt.onEvent({event: 'mock'})
        expect(dt.getTrackingData).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(0)
    })

    test('Only track a click event (not the focus event) where its value as content for a radio element', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        let el = createElement('test', 'input', 'radio', 'value')
        dispatchEvent(el, 'focus')
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(3)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'click',
            object: 'input',
            content: 'value'
        })

        getTrackingDataSpy.mockClear()
        am.track.mockClear()

        el = createElement('test', 'input', 'radio', null, 'content')
        dispatchEvent(el, 'focus')
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(3)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'click',
            object: 'input',
            content: 'on'
        })
    })

    test('Only track a click event (not the focus and change event) for a checkbox element, where its content reflects the element.checked attribute', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'input', 'checkbox')
        dispatchEvent(el, 'focus')
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(3)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'click',
            object: 'input',
            content: true
        })

        getTrackingDataSpy.mockClear()
        am.track.mockClear()

        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(2)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'click',
            object: 'input'
        })
    })

    test('Track events on an input node (focus event - dont track if its a radio or checkbox element)', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'input')
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'focus',
            object: 'input'
        })
    })

    test('Track events on a select node (focus and change events)', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'select')
        dispatchEvent(el, 'focus')
        dispatchEvent(el, 'change')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(2)
        expect(am.track).toHaveBeenCalledTimes(2)
        expect(am.track.mock.calls[0]).toEqual([
            UIINTERACTION,
            {
                subject: 'user',
                name: 'test',
                action: 'focus',
                object: 'select'
            }
        ])
        expect(am.track.mock.calls[1]).toEqual([
            UIINTERACTION,
            {
                subject: 'user',
                name: 'test',
                action: 'change',
                object: 'select'
            }
        ])
    })

    test('Track events on a textarea node (focus event)', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'textarea')
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'focus',
            object: 'textarea'
        })
    })

    test('Do not track consecutive focus on the same element', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'textarea')
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'focus',
            object: 'textarea'
        })

        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(2)
        expect(am.track).toHaveBeenCalledTimes(1)
    })

    test('If a data-analytics-name specified on the element, always track it', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'somenode', null, null)
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'focus',
            object: 'somenode'
        })
    })

    test('If no data-analytics-name is specified, do not track', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement(null, 'input', 'radio')
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(am.track).not.toHaveBeenCalled()
    })

    test('If an element that has a focus event also triggers other events, track them all', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'div')
        dispatchEvent(el, 'focus')
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(2)
        expect(am.track).toHaveBeenCalledTimes(2)
        expect(am.track.mock.calls[0]).toEqual([
            UIINTERACTION,
            {
                subject: 'user',
                name: 'test',
                action: 'focus',
                object: 'div'
            }
        ])
        expect(am.track.mock.calls[1]).toEqual([
            UIINTERACTION,
            {
                subject: 'user',
                name: 'test',
                action: 'click',
                object: 'div'
            }
        ])
    })

    test(`If element has no value or data-analytics-content, uiInteraction 'content' is undefined`, () => {
        am.track = jest.fn()
        const el = createElement('test', 'div')
        dispatchEvent(el, 'focus')
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'focus',
            object: 'div'
        })
        expect(am.track.mock.calls[0][1].content).toBeUndefined()
    })

    test(`If element has value or data-analytics-content, uiInteraction 'content' is undefined`, () => {
        am.track = jest.fn()
        const el = createElement('test', 'div')
        dispatchEvent(el, 'focus')
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'focus',
            object: 'div'
        })
        expect(am.track.mock.calls[0][1].content).toBeUndefined()
    })

    test('If a data-analytics-name specified on the element, always track it', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const getEventElementSpy = jest.spyOn(dt, 'getEventElement')
        const el = createElement('test', 'somenode', null, null)
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(getEventElementSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'click',
            object: 'somenode'
        })
    })

    test('If click occurs on child node with no analytics, track event on its parent', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const getEventElementSpy = jest.spyOn(dt, 'getEventElement')
        const el = createElement(null, 'input', 'button')
        const parent = createElement('test', 'parent', null, null)
        parent.appendChild(el)
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(getEventElementSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledWith(UIINTERACTION, {
            subject: 'user',
            name: 'test',
            action: 'click',
            object: 'parent'
        })
    })

    test('If click occurs on child node with no analytics and all its ancestors also have no analytics, dont track', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const getEventElementSpy = jest.spyOn(dt, 'getEventElement')
        const el = createElement(null, 'input', 'button')
        const parent = createElement(null, 'parent', null, null)
        parent.appendChild(el)
        dispatchEvent(el, 'click')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(getEventElementSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(0)
    })

    test('If an element was the last focused element, do not track its focus again', () => {
        const dt = am.domTracker
        am.track = jest.fn()
        const getTrackingDataSpy = jest.spyOn(dt, 'getTrackingData')
        const el = createElement('test', 'div')
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(1)
        expect(am.track).toHaveBeenCalledTimes(1)
        expect(am.track.mock.calls[0]).toEqual([
            UIINTERACTION,
            {
                subject: 'user',
                name: 'test',
                action: 'focus',
                object: 'div'
            }
        ])
        dispatchEvent(el, 'focus')
        expect(getTrackingDataSpy).toHaveBeenCalledTimes(2)
        expect(am.track).toHaveBeenCalledTimes(1) // track is not called again.
    })
})
