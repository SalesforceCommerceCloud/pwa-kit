/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import {mount} from 'enzyme'
import React from 'react'

import bazaarvoiceWrapper from './index.jsx'

const removeScripts = (src) => {
    const scripts = global.document.querySelectorAll(`[src="${src}"]`)
    const scriptsAsArray = [...scripts]
    scriptsAsArray.forEach((script) => script.remove())
}

const addScript = (src, loading = false, loaded = true) => {
    const script = global.document.createElement('script')
    script.src = src
    script.classList.add('js-bvapi')
    if (loading) {
        script.classList.add('pw--loading')
    }
    if (loaded) {
        script.classList.add('pw--loaded')
    }
    global.document.body.appendChild(script)
}

describe('bazaarvoiceWrapper higher order component', () => {
    // This HOC uses the AppError, which means that window.Progressive.analytics.send
    // must be defined for this test
    window.Progressive = {
        analytics: {
            send: () => {}
        }
    }

    const mockHtml = <div className="mock">Fake component</div>
    const mockComponent = () => mockHtml
    mockComponent.displayName = 'Foo'

    const WrapperComponent = bazaarvoiceWrapper(mockComponent)

    const src = 'http://www.test.com/test.js'

    beforeAll(() => {
        removeScripts(src)
    })

    afterEach(() => {
        removeScripts(src)
    })

    test('loads the Bazaarvoice API', () => {
        mount(<WrapperComponent apiSrc={src} />)
        const script = document.body.children[0]

        expect(script.src).toBe(src)
    })

    test('loads the Bazaarvoice API only once', () => {
        mount(
            <div>
                <WrapperComponent apiSrc={src} />
                <WrapperComponent apiSrc={src} />
                <WrapperComponent apiSrc={src} />
            </div>
        )

        const scripts = document.querySelectorAll(`[src="${src}"]`)
        expect(scripts.length).toBe(1)
    })

    test('apiLoaded is true if existing script has loaded', () => {
        addScript(src, false, true)
        const wrapper = mount(<WrapperComponent apiSrc={src} />)
        expect(wrapper.state('apiLoaded')).toBeTruthy()
        const scripts = document.querySelectorAll(`[src="${src}"]`)
        expect(scripts.length).toBe(1)
    })

    test('existing script has loading class but has loaded', () => {
        global.BV = true
        addScript(src, true, false)
        const wrapper = mount(<WrapperComponent apiSrc={src} />)
        expect(wrapper.state('apiLoaded')).toBeTruthy()
        const scripts = document.querySelectorAll(`[src="${src}"]`)
        expect(scripts.length).toBe(1)
    })

    test('mounts wrapped component after the script has loaded', () => {
        const wrapper = mount(<WrapperComponent apiSrc={src} />)
        wrapper.setState({apiLoaded: true})
        expect(wrapper.find('.mock').length).toBe(1)
    })

    test('calls $BV.configure after the script has loaded', () => {
        window.$BV = {
            configure: jest.fn()
        }

        const configurationOptions = {}

        const wrapper = mount(
            <WrapperComponent apiSrc={src} configurationOptions={configurationOptions} />
        )

        const script = document.querySelector(`[src="${src}"]`)
        script.dispatchEvent(new Event('load', {cancelable: false, bubbles: false}))
        expect(window.$BV.configure).toBeCalledWith('global', configurationOptions)
        expect(wrapper.state('apiLoaded')).toBe(true)
    })

    test('$BV.configure not called with API v2', () => {
        window.$BV = {
            configure: jest.fn()
        }

        const configurationOptions = {}

        const wrapper = mount(
            <WrapperComponent
                apiSrc={src}
                apiVersion="2"
                configurationOptions={configurationOptions}
            />
        )

        const script = document.querySelector(`[src="${src}"]`)
        script.dispatchEvent(new Event('load', {cancelable: false, bubbles: false}))
        expect(window.$BV.configure).not.toHaveBeenCalled()
        expect(wrapper.state('apiLoaded')).toBe(true)
    })

    test('calls onError when the script fails to load', () => {
        const onError = jest.fn()

        mount(<WrapperComponent apiSrc={src} onError={onError} />)

        const script = document.querySelector(`[src="${src}"]`)
        script.dispatchEvent(new Event('error', {cancelable: false, bubbles: false}))
        expect(onError).toBeCalled()
    })

    test('sets apiLoaded to true if another instance has already loaded it', () => {
        window.$BV = {
            configure: () => {}
        }

        mount(<WrapperComponent apiSrc={src} />)
        const script = document.querySelector(`[src="${src}"]`)
        script.dispatchEvent(new Event('load', {cancelable: false, bubbles: false}))

        const secondWrapper = mount(<WrapperComponent apiSrc={src} />)
        expect(secondWrapper.state('apiLoaded')).toBe(true)
    })

    test('remove event listeners on component unmount', () => {
        window.$BV = {
            configure: jest.fn()
        }
        const onError = jest.fn()
        const configurationOptions = {}
        const wrapper = mount(
            <WrapperComponent
                apiSrc={src}
                onError={onError}
                configurationOptions={configurationOptions}
            />
        )
        const script = document.querySelector(`[src="${src}"]`)

        wrapper.unmount()
        script.dispatchEvent(new Event('load', {cancelable: false, bubbles: false}))
        script.dispatchEvent(new Event('error', {cancelable: false, bubbles: false}))
        expect(onError).not.toHaveBeenCalled()
        expect(window.$BV.configure).not.toHaveBeenCalled()
    })
})
