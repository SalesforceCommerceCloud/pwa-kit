/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'
import {getBreakpoints} from 'progressive-web-sdk/dist/utils/universal-utils'
import {VIEWPORT_SIZE_NAMES} from 'progressive-web-sdk/dist/ssr/constants'

import ResponsiveContext from './index'

describe('ResponsiveContext', () => {
    beforeEach(() => {
        // The server puts its guess on window.Progressive
        window.Progressive = {viewportSize: VIEWPORT_SIZE_NAMES.LARGE}
    })

    afterEach(() => {
        delete window.Progressive
    })

    test('makes the app re-render on the client to fix incorrect viewportSize guesses on the server', () => {
        const breakpoints = getBreakpoints()
        const valueBefore = {width: breakpoints[VIEWPORT_SIZE_NAMES.LARGE]}
        const wrapper = shallow(<ResponsiveContext />, {disableLifecycleMethods: true})
        expect(wrapper.state()).toEqual({value: valueBefore})
        wrapper.instance().componentDidMount()
        expect(wrapper.state()).toEqual({value: undefined})
    })
})
