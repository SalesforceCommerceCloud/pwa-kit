/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import ScrollTo from './index'
import {render} from 'enzyme'

test('ScrollTo renders on server side without errors', () => {
    expect(() => {
        render(
            <ScrollTo target={100} duration={100}>
                Go to the position
            </ScrollTo>
        )
    }).not.toThrow()
})

test('ScrollTo renders its children on server side without errors', () => {
    const wrapper = render(
        <ScrollTo target={0} duration={100}>
            Go to the top
        </ScrollTo>
    )
    expect(wrapper.children().attr('class')).toEqual('pw-button__inner')
    expect(wrapper.text()).toEqual('Go to the top')
})
