/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import bazaarvoiceWrapper from './index'
import {render} from 'enzyme'

test('bazaarvoiceWrapper higher order component can render on server side without errors', () => {
    const mockHtml = <div className="mock">Fake component</div>
    const mockComponent = () => mockHtml
    mockComponent.displayName = 'Foo'

    const WrapperComponent = bazaarvoiceWrapper(mockComponent)
    expect(() => {
        render(<WrapperComponent />)
    }).not.toThrow()
})

test('bazaarvoiceWrapper higher order component should render null on server side', () => {
    const componentContent = 'Fake component'
    const mockHtml = <div className="mock">{componentContent}</div>
    const mockComponent = () => mockHtml
    mockComponent.displayName = 'Foo'

    const WrapperComponent = bazaarvoiceWrapper(mockComponent)
    const wrapper = render(<WrapperComponent />)
    // Component will render nothing as no script is loaded on sever side
    expect(wrapper.html()).toBeFalsy()
})
