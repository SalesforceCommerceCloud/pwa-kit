/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import ProductViewModal from '../../components/product-view-modal/index'
import {renderWithProviders} from '../../utils/test-utils'
import {act, fireEvent, screen} from '@testing-library/react'
import {useDisclosure} from '@chakra-ui/react'
import mockProductDetail from '../../../mocks/variant-750518699578M'
import {prependHandlersToServer} from '../../../jest-setup'

const MockComponent = ({updateCart}) => {
    const {open, onOpen, onClose} = useDisclosure()

    return (
        <div>
            <button onClick={onOpen}>Open Modal</button>
            <ProductViewModal
                updateCart={updateCart}
                onOpen={onOpen}
                onClose={onClose}
                isOpen={open}
                product={mockProductDetail}
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
                return mockProductDetail
            }
        }
    ])
})

test('renders product view modal by default', async () => {
    const {user} = renderWithProviders(<MockComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await act(async () => {
        await user.click(trigger)
    })

    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toHaveLength(2)
})

test('renders product view modal with handleUpdateCart handler', async () => {
    const handleUpdateCart = jest.fn()
    const {user} = renderWithProviders(<MockComponent updateCart={handleUpdateCart} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    await act(async () => {
        await user.click(trigger)
    })

    // click on update
    const updateButton = screen.getAllByText(/Update/)[0]
    await act(async () => {
        await user.click(updateButton)
    })

    expect(handleUpdateCart).toHaveBeenCalledTimes(1)
})
