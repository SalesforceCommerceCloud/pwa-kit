/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import App from './index'

describe('App', () => {
    test('Renders correctly', () => {
        const body = <p>Hello world</p>
        const wrapper = shallow(<App>{body}</App>)
        expect(wrapper.contains(body)).toBe(true)
    })
})
