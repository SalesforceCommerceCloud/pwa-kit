/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import Throw404 from './index'
import * as errors from '../../errors'

describe('Throw404', () => {
    test('Renders correctly', () => {
        const wrapper = shallow(<Throw404 />)
        expect(wrapper.html()).toBe('<div></div>')
    })

    test('Throws on getProps', () => {
        expect(() => Throw404.getProps()).toThrow(errors.HTTPNotFound)
    })
})
