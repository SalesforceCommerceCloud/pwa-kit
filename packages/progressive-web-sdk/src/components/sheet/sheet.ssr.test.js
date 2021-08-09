/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {render} from 'enzyme'
import React from 'react'
import Sheet from './index.jsx'
import SheetContent from './sheet-content.jsx'

test('Sheet renders server-side without errors', () => {
    const wrapper = render(<Sheet />)

    expect(wrapper.length).toBe(1)
    expect(wrapper.find('div').length).toBe(1)
})

test('SheetContent renders server-side without errors', () => {
    const wrapper = render(<SheetContent {...Sheet.defaultProps} />)

    expect(wrapper.length).toBe(1)
    expect(wrapper.find('.pw-sheet__mask').length).toBe(1)
    expect(wrapper.find('.pw-sheet__wrapper').length).toBe(1)
    expect(wrapper.find('.pw-sheet__content').length).toBe(1)
})
