import React from 'react'
import {Context as ResponsiveContext} from 'react-responsive'
import {BREAKPOINTS} from '../../responsive-config'
import * as mq from './index'
import {render} from 'enzyme'

describe('Media queries', () => {
    const cases = [
        {MediaQuery: mq.Desktop, width: BREAKPOINTS.LARGE, visible: true},
        {MediaQuery: mq.Desktop, width: BREAKPOINTS.LARGE - 1, visible: false},
        {MediaQuery: mq.Tablet, width: BREAKPOINTS.MEDIUM, visible: true},
        {MediaQuery: mq.Tablet, width: BREAKPOINTS.MEDIUM - 1, visible: false},
        {MediaQuery: mq.Tablet, width: BREAKPOINTS.LARGE - 1, visible: true},
        {MediaQuery: mq.Tablet, width: BREAKPOINTS.LARGE, visible: false},
        {MediaQuery: mq.TabletOrSmaller, width: BREAKPOINTS.LARGE - 1, visible: true},
        {MediaQuery: mq.TabletOrSmaller, width: BREAKPOINTS.LARGE, visible: false},
        {MediaQuery: mq.Mobile, width: BREAKPOINTS.MEDIUM - 1, visible: true},
        {MediaQuery: mq.Mobile, width: BREAKPOINTS.MEDIUM, visible: false}
    ]

    cases.forEach(({MediaQuery, width, visible}) => {
        test(`The ${MediaQuery.name} MediaQuery works at ${JSON.stringify({width})}`, () => {
            const wrapper = render(
                <ResponsiveContext.Provider value={{width}}>
                    <MediaQuery>
                        <p>visible</p>
                    </MediaQuery>
                </ResponsiveContext.Provider>
            )
            const isVisible = wrapper.text() === 'visible'
            expect(isVisible).toEqual(visible)
        })
    })
})
