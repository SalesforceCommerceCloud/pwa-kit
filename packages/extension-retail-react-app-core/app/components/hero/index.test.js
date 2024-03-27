/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import Hero from '@salesforce/retail-react-app/app/components/hero/index'

test('Hero renders without errors', () => {
    const data = {
        title: 'title',
        actions: undefined,
        img: {
            src: 'src',
            alt: 'alt'
        }
    }
    const {getByText} = renderWithProviders(<Hero {...data} />)
    expect(getByText(/title/i)).toBeInTheDocument()
})

test('Hero renders actions and event handlers', () => {
    const onClick = jest.fn()
    const data = {
        title: 'title',
        actions: <button data-testid="button" onClick={onClick}></button>,
        img: {
            src: 'src',
            alt: 'alt'
        }
    }
    const {getByTestId} = renderWithProviders(<Hero {...data} />)
    const button = getByTestId('button')
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
})
