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
    user.click(trigger)

    expect(screen.getByText(/confirm action/i)).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to continue/i)).toBeInTheDocument()
    expect(screen.getByText(/yes/i)).toBeInTheDocument()
    expect(screen.getByText(/no/i)).toBeInTheDocument()
})

test('Renders confirmation modal with the given config', async () => {
    renderWithProviders(<MockedComponent {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    expect(screen.getByText(/confirm remove item/i)).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to remove this item/i)).toBeInTheDocument()
    expect(screen.getByText(/yes, remove item/i)).toBeInTheDocument()
    expect(screen.getByText(/no, keep item/i)).toBeInTheDocument()
})

test('Verify confirm action button click', async () => {
    const onPrimaryAction = jest.fn()

    renderWithProviders(<MockedComponent onPrimaryAction={onPrimaryAction} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    const onPrimaryActionTrigger = screen.getByText(/yes/i)

    expect(screen.getByText(/confirm action/i)).toBeInTheDocument()
    expect(onPrimaryActionTrigger).toBeInTheDocument()

    user.click(onPrimaryActionTrigger)
    expect(onPrimaryAction).toHaveBeenCalledTimes(1)
})

test('Verify cancel action button click', async () => {
    const onAlternateAction = jest.fn()

    renderWithProviders(<MockedComponent onAlternateAction={onAlternateAction} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    const onAlternateActionTrigger = screen.getByText(/no/i)

    expect(screen.getByText(/confirm action/i)).toBeInTheDocument()
    expect(onAlternateActionTrigger).toBeInTheDocument()

    user.click(onAlternateActionTrigger)
    expect(onAlternateAction).toHaveBeenCalledTimes(1)
})
