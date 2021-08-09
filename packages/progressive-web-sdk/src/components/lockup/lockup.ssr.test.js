/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {render} from 'enzyme'
import Lockup from './index'

test('Lockup renders on server side without errors', () => {
    expect(() => {
        render(
            <Lockup>
                <div>Fake component</div>
            </Lockup>
        )
    }).not.toThrow()
})

test('Lockup renders content properly on server side', () => {
    const componentContent = 'Fake Component'
    const wrapper = render(
        <Lockup locked>
            <div>{componentContent}</div>
        </Lockup>
    )
    expect(wrapper.attr('class')).toEqual('pw-lockup pw--is-locked')
    expect(wrapper.text()).toEqual(componentContent)
})
