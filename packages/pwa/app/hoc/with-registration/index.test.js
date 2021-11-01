/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {Button} from '@chakra-ui/react'
import {screen, waitFor} from '@testing-library/react'
import React from 'react'
import withRegistration from './index'
import {renderWithProviders} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {mockedRegisteredCustomer, mockedGuestCustomer} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'

jest.setTimeout(60000)
jest.useFakeTimers()

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const ButtonWithRegistration = withRegistration(Button)

const MockedComponent = (props) => {
    return (
        <div>
            <ButtonWithRegistration {...props}>Button</ButtonWithRegistration>
        </div>
    )
}

jest.mock('../../commerce-api/hooks/useCustomer', () => {
    return () => ({
        isRegistered: false
    })
})

beforeEach(() => {
    jest.resetModules()
})

test('should execute onClick for registered users', async () => {
    const onClick = jest.fn()

    renderWithProviders(<MockedComponent onClick={onClick} />)

    const trigger = screen.getByText(/button/i)
    user.click(trigger)

    expect(onClick).toHaveBeenCalledTimes(1)
})

test('should show login modal if user not registered', () => {
    const onClick = jest.fn()

    renderWithProviders(<MockedComponent onClick={onClick} />)

    const trigger = screen.getByText(/button/i)
    user.click(trigger)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
})
