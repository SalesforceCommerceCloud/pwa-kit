/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {render} from 'enzyme'
import React from 'react'

import Image from './index'

test('Image does not render a skeleton on the server side', () => {
    const wrapper = render(<Image />)
    const skeleton = wrapper.find('.pw-skeleton-block.pw--image')
    expect(skeleton.length).toBe(0)
})
