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
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {useDisclosure} from '@chakra-ui/react'
import {
    mockBundledProductItemsVariant,
    mockProductBundleWithVariants,
    mockProductBundle
} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'

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
    prependHandlersToServer([
        {
            path: '*/products/:productId',
            res: () => {
                return mockProductBundle
            }
        },
        {
            path: '*/products',
            res: () => {
                return mockProductBundleWithVariants
            }
        }
    ])
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
