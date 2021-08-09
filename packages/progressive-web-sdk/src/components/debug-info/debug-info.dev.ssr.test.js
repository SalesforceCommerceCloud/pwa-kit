/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {render} from 'enzyme'
import DebugInfoDev from './debug-info-dev'

test('DebugInfoDev renders on server side without errors', () => {
    const wrapper = render(<DebugInfoDev />)
    expect(wrapper.html().includes('<button class="pw-button" type="button">')).toBe(true)
})
