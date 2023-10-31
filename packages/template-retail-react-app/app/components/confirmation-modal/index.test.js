/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal/index'
import {Box, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {screen} from '@testing-library/react'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'

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
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    expect(screen.getByText(/confirm action/i)).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to continue/i)).toBeInTheDocument()
    expect(screen.getByText(/yes/i)).toBeInTheDocument()
    expect(screen.getByText(/no/i)).toBeInTheDocument()
})

test('Renders confirmation modal with the given config', async () => {
    const user = userEvent.setup()

    renderWithProviders(<MockedComponent {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    expect(screen.getByText(/confirm remove item/i)).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to remove this item/i)).toBeInTheDocument()
    expect(screen.getByText(/yes, remove item/i)).toBeInTheDocument()
    expect(screen.getByText(/no, keep item/i)).toBeInTheDocument()
})

test('Verify confirm action button click', async () => {
    const user = userEvent.setup()

    const onPrimaryAction = jest.fn()

    renderWithProviders(<MockedComponent onPrimaryAction={onPrimaryAction} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    const onPrimaryActionTrigger = screen.getByText(/yes/i)

    expect(screen.getByText(/confirm action/i)).toBeInTheDocument()
    expect(onPrimaryActionTrigger).toBeInTheDocument()

    await user.click(onPrimaryActionTrigger)
    expect(onPrimaryAction).toHaveBeenCalledTimes(1)
})

test('Verify cancel action button click', async () => {
    const user = userEvent.setup()

    const onAlternateAction = jest.fn()

    renderWithProviders(<MockedComponent onAlternateAction={onAlternateAction} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await user.click(trigger)

    const onAlternateActionTrigger = screen.getByText(/no/i)

    expect(screen.getByText(/confirm action/i)).toBeInTheDocument()
    expect(onAlternateActionTrigger).toBeInTheDocument()

    await user.click(onAlternateActionTrigger)
    expect(onAlternateAction).toHaveBeenCalledTimes(1)
})
