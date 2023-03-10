/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import ProductViewModal from './index'
import {renderWithProviders} from '../../utils/test-utils'
import {fireEvent, screen} from '@testing-library/react'
import {useDisclosure} from '@chakra-ui/react'
import mockProductDetail from '../../commerce-api/mocks/variant-750518699578M'

const MockComponent = ({updateCart}) => {
    const {isOpen, onOpen, onClose} = useDisclosure()

    return (
        <div>
            <button onClick={onOpen}>Open Modal</button>
            {isOpen && (
                <ProductViewModal
                    updateCart={updateCart}
                    onOpen={onOpen}
                    onClose={onClose}
                    isOpen={isOpen}
                    product={mockProductDetail}
                />
            )}
        </div>
    )
}

MockComponent.propTypes = {
    updateCart: PropTypes.func
}

test('renders product view modal by default', () => {
    renderWithProviders(<MockComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    fireEvent.click(trigger)

    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i).length).toEqual(2)
})

test('renders product view modal with handleUpdateCart handler', () => {
    const handleUpdateCart = jest.fn()
    renderWithProviders(<MockComponent updateCart={handleUpdateCart} />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    fireEvent.click(trigger)

    // click on update
    const updateButton = screen.getAllByText(/Update/)[0]
    fireEvent.click(updateButton)

    expect(handleUpdateCart).toHaveBeenCalledTimes(1)
})
