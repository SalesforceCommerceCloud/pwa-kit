/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import {rest} from 'msw'
import AccountAddresses from './addresses'
import useCustomer from '../../commerce-api/hooks/useCustomer'

let mockCustomer = {}

jest.setTimeout(30000)

const mockToastSpy = jest.fn()
jest.mock('@chakra-ui/toast', () => {
    return {
        useToast: jest.fn(() => mockToastSpy)
    }
})

const MockedComponent = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])
    return (
        <div>
            <div>{customer.customerId}</div>
            <AccountAddresses />
        </div>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    mockCustomer = {
        authType: 'registered',
        customerId: 'registeredCustomerId',
        customerNo: '00151503',
        email: 'jkeane@64labs.com',
        firstName: 'John',
        lastName: 'Keane',
        login: 'jkeane@64labs.com'
    }
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockCustomer))
        }),
        rest.post('*/customers/:customerId/addresses', (req, res, ctx) => {
            mockCustomer.addresses = [req.body]
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        }),
        rest.patch('*/customers/:customerId/addresses/:addressName', (req, res, ctx) => {
            mockCustomer.addresses[0] = req.body
            return res(ctx.delay(0), ctx.status(200), ctx.json(req.body))
        }),
        rest.delete('*/customers/:customerId/addresses/:addressName', (req, res, ctx) => {
            mockCustomer.addresses = undefined
            return res(ctx.delay(0), ctx.status(200))
        })
    )
})
afterEach(() => {
    localStorage.clear()
})

test('Allows customer to add/edit/remove addresses', async () => {
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(screen.getByText('registeredCustomerId')).toBeInTheDocument())

    expect(screen.getByText(/no saved addresses/i)).toBeInTheDocument()

    // Click add address button and wait for form
    await user.click(screen.getByText(/add address/i))
    await waitFor(() => expect(screen.getByLabelText('First Name')).toBeInTheDocument())

    // Fill out the form fields one by one with proper waiting
    const firstNameInput = screen.getByLabelText('First Name')
    const lastNameInput = screen.getByLabelText('Last Name')
    const phoneInput = screen.getByLabelText('Phone')
    const addressInput = screen.getByLabelText('Address')
    const cityInput = screen.getByLabelText('City')
    const stateInput = screen.getByLabelText(/state/i)
    const zipInput = screen.getByLabelText('Zip Code')

    // Type into each field and wait for the value to be set
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Tyler')
    await waitFor(() => expect(firstNameInput).toHaveValue('Tyler'))

    await user.clear(lastNameInput)
    await user.type(lastNameInput, 'Glasnow')
    await waitFor(() => expect(lastNameInput).toHaveValue('Glasnow'))

    await user.clear(phoneInput)
    await user.type(phoneInput, '7277277727')
    await waitFor(() => expect(phoneInput).toHaveValue('(727) 727-7727'))

    await user.clear(addressInput)
    await user.type(addressInput, 'Tropicana Field')
    await waitFor(() => expect(addressInput).toHaveValue('Tropicana Field'))

    await user.clear(cityInput)
    await user.type(cityInput, 'St Petersburg')
    await waitFor(() => expect(cityInput).toHaveValue('St Petersburg'))

    await user.selectOptions(stateInput, ['FL'])
    await waitFor(() => expect(stateInput).toHaveValue('FL'))

    await user.clear(zipInput)
    await user.type(zipInput, '33701')
    await waitFor(() => expect(zipInput).toHaveValue('33701'))

    // Submit the form
    await user.click(screen.getByText(/^Save$/i))

    // Verify the address was added
    await waitFor(() => {
        expect(screen.getByText(/Tropicana Field/i)).toBeInTheDocument()
    })

    // edit
    await user.click(screen.getByText(/edit/i))
    await waitFor(() => expect(screen.getByLabelText('Address')).toBeInTheDocument())

    // Get the address input field
    const addressInputEdit = screen.getByLabelText('Address')

    // Clear and type new address
    await user.clear(addressInputEdit)
    await user.type(addressInputEdit, '333 Main St')
    await waitFor(() => expect(addressInputEdit).toHaveValue('333 Main St'))

    // Click set as default and wait for it to be checked
    const defaultCheckbox = screen.getByLabelText(/set as default/i)
    await user.click(defaultCheckbox)
    await waitFor(() => expect(defaultCheckbox).toBeChecked())

    // Click save and wait for the update
    await user.click(screen.getByText(/^Save$/i))

    // Verify the changes were saved
    await waitFor(() => {
        expect(screen.getByText(/333 main st/i)).toBeInTheDocument()
        expect(screen.getByText(/default/i)).toBeInTheDocument()
    })

    // remove
    await user.click(screen.getByText(/remove/i))
    expect(await screen.findByText(/no saved addresses/i)).toBeInTheDocument()
})
