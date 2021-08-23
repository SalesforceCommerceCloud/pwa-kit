/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import ActionCard from './index'
import {renderWithProviders} from '../../utils/test-utils'
import {screen, act} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

afterEach(() => {
    jest.clearAllMocks()
})

test('should throw err', () => {
    const failedPromise = jest.fn(() => Promise.reject(new Error()))
    renderWithProviders(<ActionCard onRemove={failedPromise}>Action card</ActionCard>)
    act(() => {
        const removeButton = screen.getByText(/Remove/)

        userEvent.click(removeButton)
    })
    expect(failedPromise).toBeCalledTimes(1)
})
