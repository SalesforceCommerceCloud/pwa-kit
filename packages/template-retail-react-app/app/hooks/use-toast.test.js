/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useToast} from './use-toast'
import {Button} from '@chakra-ui/react'
import {renderWithProviders} from '../utils/test-utils'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'

jest.setTimeout(60000)
const MockedComponent = (props) => {
    const showToast = useToast()

    const renderToast = () => {
        showToast({
            ...props,
            title: 'Demo Notification',
            status: 'success',
            duration: 1000,
            variant: 'subtle'
        })
    }
    return (
        <>
            <Button onClick={renderToast}>show toast</Button>
        </>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('renders toast with action', async () => {
    const handleActionClick = jest.fn()
    const toastAction = <Button onClick={handleActionClick}>action</Button>

    renderWithProviders(<MockedComponent action={toastAction} />)

    const toastTrigger = await screen.findByRole('button', {name: /show toast/i})
    user.click(toastTrigger)

    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(screen.getByRole('alert')).toHaveTextContent(/demo notification/i)
    })

    const toastActionTrigger = await screen.findByRole('button', {name: /action/i})
    user.click(toastActionTrigger)
    expect(handleActionClick).toHaveBeenCalledTimes(1)
})
