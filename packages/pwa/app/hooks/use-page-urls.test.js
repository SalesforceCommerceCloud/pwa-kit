/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {Router} from 'react-router'

import {render} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {usePageUrls} from './use-page-urls'

const MockComponent = () => {
    const urls = usePageUrls({total: 100})

    return (
        <script data-testid="limits" type="application/json">
            {JSON.stringify(urls)}
        </script>
    )
}

describe('The usePageUrls', () => {
    test('returns an array of urls, one values for each page with the correct offset value.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?limit=25')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('limits').text).toEqual(
            '["/test/path?limit=25&offset=0","/test/path?limit=25&offset=25","/test/path?limit=25&offset=50","/test/path?limit=25&offset=75"]'
        )
    })
})
