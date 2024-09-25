/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {DntModal, useDntModal} from '@salesforce/retail-react-app/app/hooks/use-dnt-modal'

const mockUpdateDNT = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useDNT: () => ({dntStatus: undefined, updateDNT: mockUpdateDNT})
    }
})

const MockedComponent = () => {
    const dntModal = useDntModal()
    return <DntModal {...dntModal} />
}

afterEach(() => {
    localStorage.clear()
    jest.resetModules()
})

test('Modal gives the expected text', async () => {
    renderWithProviders(<MockedComponent />)
    await waitFor(() => {
        expect(screen.getByText(/Tracking Consent/i)).toBeInTheDocument()
    })
})

test('Clicking out of modal does setDNT(null)', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent />)

    // open the modal
    const closeButton = screen.getByLabelText('Close dnt form')
    await user.click(closeButton)

    await waitFor(() => {
        expect(mockUpdateDNT).toHaveBeenCalledWith(null)
    })
})

test('Clicking Accept does setDNT(false)', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent />)

    // open the modal
    const acceptButton = screen.getAllByText('Accept')[0]
    await user.click(acceptButton)

    await waitFor(() => {
        expect(mockUpdateDNT).toHaveBeenCalledWith(false)
    })
})

test('Clicking Decline does setDNT(true)', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent />)

    // open the modal
    const acceptButton = screen.getAllByText('Decline')[0]
    await user.click(acceptButton)

    await waitFor(() => {
        expect(mockUpdateDNT).toHaveBeenCalledWith(true)
    })
})
