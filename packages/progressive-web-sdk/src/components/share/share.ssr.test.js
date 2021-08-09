/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {render} from 'enzyme'
import React from 'react'
import Share from './index.jsx'

test('Renders share button and sheet wrapper on server-side', () => {
    const wrapper = render(<Share />)

    expect(wrapper.find('.pw-share__trigger').length).toBe(1)
    expect(wrapper.find('.pw-sheet__outer-wrapper').length).toBe(1)
})
