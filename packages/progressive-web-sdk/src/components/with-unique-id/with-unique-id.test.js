/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import {mount} from 'enzyme'
import React from 'react'

import withUniqueId from './index.jsx'

describe('withUniqueId higher order component', () => {
    const wrappedComponentName = 'Foo'
    const wrappedClassName = 'mock'
    const fakeText = 'Fake component'
    const mockHtml = <div className={wrappedClassName}>{fakeText}</div>
    const mockComponent = () => mockHtml
    mockComponent.displayName = wrappedComponentName

    const WrapperComponent = withUniqueId(mockComponent)

    test('withUniqueId wrapped component renders without errors', () => {
        const wrapper = mount(<WrapperComponent />)
        expect(wrapper.length).toBe(1)
    })

    test('Render UID component', () => {
        const wrapper = mount(<WrapperComponent />)

        expect(wrapper.find('UID').first().length).toBe(1)
    })

    test('Find the UUID inside the component', () => {
        const wrapper = mount(<WrapperComponent />)

        expect(wrapper.find(wrappedComponentName).props().id).toBe('1-1')
    })

    test('If id is defined, it is not overwritten by uid', () => {
        const wrapper = mount(<WrapperComponent id="0-0" />)

        expect(wrapper.find(wrappedComponentName).props().id).toBe('0-0')
    })

    test('Render children component', () => {
        const wrapper = mount(<WrapperComponent />)

        expect(
            wrapper
                .find(wrappedComponentName)
                .children()
                .hasClass(wrappedClassName)
        ).toBe(true)
        expect(
            wrapper
                .find(wrappedComponentName)
                .children()
                .text()
        ).toBe(fakeText)
    })
})
