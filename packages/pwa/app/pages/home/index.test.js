/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import HomePage from './index'

jest.mock('../../commerce-api/einstein')

test('Home Page renders without errors', async () => {
    const {getByTestId, findAllByText} = renderWithProviders(<HomePage />)

    expect(getByTestId('home-page')).toBeInTheDocument()
    expect(await findAllByText('Product ABC')).toHaveLength(2)
    expect(typeof HomePage.getTemplateName()).toEqual('string')
})
