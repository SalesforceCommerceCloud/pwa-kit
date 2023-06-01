/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import ScrollToTop from '@salesforce/retail-react-app/app/components/scroll-to-top/index'
import {Router} from 'react-router-dom'
import {createMemoryHistory} from 'history'

global.scrollTo = jest.fn()

describe('ScrollToTop', () => {
    let history = createMemoryHistory({initialEntries: ['/']})

    beforeEach(() => {
        render(
            <Router history={history}>
                <ScrollToTop />
            </Router>
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('calls window.scrollTo when route changes', async () => {
        expect(global.scrollTo).toHaveBeenCalledTimes(1)
        expect(global.scrollTo).toHaveBeenCalledWith(0, 0)

        history.push('/new-url')
        await waitFor(() => {
            expect(global.scrollTo).toHaveBeenCalledTimes(2)
        })
        expect(global.scrollTo).toHaveBeenCalledWith(0, 0)

        history.push('/new-url2')
        await waitFor(() => {
            expect(global.scrollTo).toHaveBeenCalledTimes(3)
        })
        expect(global.scrollTo).toHaveBeenCalledWith(0, 0)
    })
})
