/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import Pagination from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockUrls = ['/test?offset=0', '/test?offset=25', '/test?offset=50', '/test?offset=75']
const mockCurrentUrl = '/test?offset=25'

test('Renders Breadcrum', () => {
    const {getAllByRole} = renderWithProviders(
        <Pagination urls={mockUrls} currentUrl={mockCurrentUrl} />
    )

    const [prev, next] = getAllByRole('link')
    const option = getAllByRole('option')

    expect(prev).toBeDefined()
    expect(next).toBeDefined()
    expect(option.length).toEqual(mockUrls.length)
})
