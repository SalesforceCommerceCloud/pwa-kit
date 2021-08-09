/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'

import ResponsiveContainer from './index'

describe('ResponsiveContainer', () => {
    test('makes the app re-render on the client to fix incorrect device types reported by the server', () => {
        const deviceType = 'mobile'
        const wrapper = shallow(<ResponsiveContainer deviceType={deviceType} />, {
            disableLifecycleMethods: true
        })
        expect(wrapper.state()).toEqual({deviceType: deviceType})
        wrapper.instance().componentDidMount()
        expect(wrapper.state()).toEqual({deviceType: undefined})
    })
})
