/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    DntNotification,
    useDntNotification
} from '@salesforce/retail-react-app/app/hooks/use-dnt-notification'

const mockUpdateDNT = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useDNT: () => ({dntStatus: undefined, updateDNT: mockUpdateDNT})
    }
})

const MockedComponent = () => {
    const dntNotification = useDntNotification()
    return <DntNotification {...dntNotification} />
}

afterEach(() => {
    localStorage.clear()
    jest.resetModules()
})

test('Notification renders properly', async () => {
    renderWithProviders(<MockedComponent />)
    await waitFor(() => {
        expect(screen.getByText(/Tracking Consent/i)).toBeInTheDocument()
    })
})

test('Clicking out of notification does setDNT(null)', async () => {
    const {user} = renderWithProviders(<MockedComponent />)

    // open the notification
    const closeButton = screen.getByLabelText('Close consent tracking form')
    expect(closeButton).toHaveAttribute('aria-label', 'Close consent tracking form')
    await user.click(closeButton)

    await waitFor(() => {
        expect(mockUpdateDNT).toHaveBeenCalledWith(null)
    })
})

test('Clicking Accept does setDNT(false)', async () => {
    const {user} = renderWithProviders(<MockedComponent />)

    // open the notification
    const acceptButton = screen.getAllByText('Accept')[0]
    expect(acceptButton).toHaveAttribute('aria-label', 'Accept tracking')
    await user.click(acceptButton)

    await waitFor(() => {
        expect(mockUpdateDNT).toHaveBeenCalledWith(false)
    })
})

test('Clicking Decline does setDNT(true)', async () => {
    const {user} = renderWithProviders(<MockedComponent />)

    // open the notification
    const declineButton = screen.getAllByText('Decline')[0]
    expect(declineButton).toHaveAttribute('aria-label', 'Decline tracking')
    await user.click(declineButton)

    await waitFor(() => {
        expect(mockUpdateDNT).toHaveBeenCalledWith(true)
    })
})
