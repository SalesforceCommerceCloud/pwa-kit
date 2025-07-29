/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ConfirmationModal from './index'
import {Box, useDisclosure} from '@chakra-ui/react'
import {renderWithProviders} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {screen} from '@testing-library/react'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '../../pages/cart/partials/cart-secondary-button-group'

const MockedComponent = (props) => {
    const modalProps = useDisclosure()

    return (
        <Box>
            <button onClick={modalProps.onOpen}>Open Modal</button>
            <ConfirmationModal {...modalProps} {...props} />
        </Box>
    )
}

afterEach(() => {
    jest.resetModules()
})

test('Renders confirmation modal with default config', async () => {
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // Wait for modal content to be rendered
    await screen.findByText('Confirm Action')
    expect(screen.getByText('Are you sure you want to continue?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
})

test('Renders confirmation modal with the given config', async () => {
    renderWithProviders(<MockedComponent {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // Wait for modal content to be rendered
    await screen.findByText('Confirm Remove Item')
    expect(
        screen.getByText('Are you sure you want to remove this item from your cart?')
    ).toBeInTheDocument()
    expect(screen.getByText('Yes, remove item')).toBeInTheDocument()
    expect(screen.getByText('No, keep item')).toBeInTheDocument()
})

test('Verify confirm action button click', async () => {
    const onPrimaryAction = jest.fn()

    renderWithProviders(<MockedComponent onPrimaryAction={onPrimaryAction} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // Wait for modal content to be rendered
    await screen.findByText('Confirm Action')
    const confirmButton = screen.getByText('Yes')
    expect(confirmButton).toBeInTheDocument()

    await user.click(confirmButton)
    expect(onPrimaryAction).toHaveBeenCalledTimes(1)
})

test('Verify cancel action button click', async () => {
    const onAlternateAction = jest.fn()

    renderWithProviders(<MockedComponent onAlternateAction={onAlternateAction} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    // Wait for modal content to be rendered
    await screen.findByText('Confirm Action')
    const cancelButton = screen.getByText('No')
    expect(cancelButton).toBeInTheDocument()

    await user.click(cancelButton)
    expect(onAlternateAction).toHaveBeenCalledTimes(1)
})
