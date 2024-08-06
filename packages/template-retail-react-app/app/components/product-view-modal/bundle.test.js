/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import BundleProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal/bundle'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {fireEvent, screen, waitFor, within} from '@testing-library/react'
import {useDisclosure} from '@chakra-ui/react'
import {
    mockBundledProductItemsVariant,
    mockProductBundleWithVariants,
    mockProductBundle
} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import {rest} from 'msw'

const MockComponent = ({updateCart}) => {
    const {isOpen, onOpen, onClose} = useDisclosure()

    return (
        <div>
            <button onClick={onOpen}>Open Modal</button>
            <BundleProductViewModal
                updateCart={updateCart}
                onOpen={onOpen}
                onClose={onClose}
                isOpen={isOpen}
                product={mockBundledProductItemsVariant}
            />
        </div>
    )
}

MockComponent.propTypes = {
    updateCart: PropTypes.func
}

beforeEach(() => {
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductBundle))
        }),
        rest.get('*/products', (req, res, ctx) => {
            const swingTankBlackMediumVariantId = '701643473915M'
            const swingTankBlackLargeVariantId = '701643473908M'
            if (req.url.toString().includes(swingTankBlackMediumVariantId)) {
                mockProductBundleWithVariants.data[1].inventory = {
                    ...mockProductBundleWithVariants.data[1].inventory,
                    stockLevel: 0
                }
            } else if (req.url.toString().includes(swingTankBlackLargeVariantId)) {
                mockProductBundleWithVariants.data[1].inventory = {
                    ...mockProductBundleWithVariants.data[1].inventory,
                    stockLevel: 1
                }
            }
            return res(ctx.json(mockProductBundleWithVariants))
        })
    )
})

test('renders bundle product view modal', async () => {
    renderWithProviders(<MockComponent />)
    await waitFor(() => {
        const trigger = screen.getByText(/open modal/i)
        fireEvent.click(trigger)
    })

    await waitFor(() => {
        const bundleTitleQuery = screen.getAllByText(/Women's clothing test bundle/i)
        expect(bundleTitleQuery[0]).toBeInTheDocument()
        expect(bundleTitleQuery).toHaveLength(2) // one for desktop and one for mobile
    })

    expect(screen.getByRole('button', {name: /update/i})).toBeInTheDocument()

    mockProductBundleWithVariants.data.forEach((childProduct) => {
        const childProductQuery = screen.getAllByText(childProduct.name)
        expect(childProductQuery[0]).toBeInTheDocument()
        expect(childProductQuery).toHaveLength(2) // one for desktop and one for mobile
    })
})

test('renders bundle product view modal with handleUpdateCart handler', async () => {
    const handleUpdateCart = jest.fn()
    renderWithProviders(<MockComponent updateCart={handleUpdateCart} />)

    // open the modal
    await waitFor(() => {
        const trigger = screen.getByText(/open modal/i)
        fireEvent.click(trigger)
    })

    // click on update
    await waitFor(() => {
        const updateButton = screen.getAllByText(/Update/)[0]
        fireEvent.click(updateButton)
    })

    expect(handleUpdateCart).toHaveBeenCalledTimes(1)
})

test('bundle product view modal disables update button when child is out of stock', async () => {
    renderWithProviders(<MockComponent />)
    await waitFor(() => {
        const trigger = screen.getByText(/open modal/i)
        fireEvent.click(trigger)
    })

    await waitFor(() => {
        const bundleTitleQuery = screen.getAllByText(/Women's clothing test bundle/i)
        expect(bundleTitleQuery[0]).toBeInTheDocument()
        expect(bundleTitleQuery).toHaveLength(2) // one for desktop and one for mobile
    })

    const productViews = screen.getAllByTestId('product-view')
    const swingTankProductView = productViews[2]
    expect(productViews).toHaveLength(4)
    expect(swingTankProductView).toBeInTheDocument()

    const updateBtn = screen.getByRole('button', {name: /update/i})
    expect(updateBtn).toBeEnabled()

    let sizeSelectBtn = within(swingTankProductView).getByLabelText('M')
    expect(sizeSelectBtn).toBeInTheDocument()
    fireEvent.click(sizeSelectBtn)

    await waitFor(() => {
        expect(within(swingTankProductView).getAllByText('M')).toHaveLength(2)
        expect(updateBtn).toBeInTheDocument()
        expect(updateBtn).toBeDisabled()
        expect(screen.getByText('Out of stock')).toBeInTheDocument()
    })
})

test('bundle product view modal disables update button when quantity exceeds child inventory', async () => {
    renderWithProviders(<MockComponent />)
    await waitFor(() => {
        const trigger = screen.getByText(/open modal/i)
        fireEvent.click(trigger)
    })

    await waitFor(() => {
        const bundleTitleQuery = screen.getAllByText(/Women's clothing test bundle/i)
        expect(bundleTitleQuery[0]).toBeInTheDocument()
        expect(bundleTitleQuery).toHaveLength(2) // one for desktop and one for mobile
    })

    const productViews = screen.getAllByTestId('product-view')
    const swingTankProductView = productViews[2]
    const updateBtn = screen.getByRole('button', {name: /update/i})
    const quantityInput = screen.getByRole('spinbutton', {name: /quantity/i})
    let sizeSelectBtn = within(swingTankProductView).getByLabelText('L')

    await waitFor(() => {
        expect(productViews).toHaveLength(4)
        expect(swingTankProductView).toBeInTheDocument()
        expect(sizeSelectBtn).toBeInTheDocument()
        expect(quantityInput).toBeInTheDocument()
        expect(updateBtn).toBeEnabled()
    })

    // Set product bundle quantity selection to 4
    quantityInput.focus()
    fireEvent.change(quantityInput, {target: {value: '4'}})
    fireEvent.keyDown(quantityInput, {key: 'Enter', code: 'Enter', charCode: 13})
    fireEvent.click(sizeSelectBtn)

    await waitFor(() => {
        expect(screen.getByRole('spinbutton', {name: /quantity/i})).toHaveValue('4')
        expect(within(swingTankProductView).getAllByText('L')).toHaveLength(2)
        expect(updateBtn).toBeDisabled()
        expect(screen.getByText('Only 1 left!')).toBeInTheDocument()
    })
})
