/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import BundleProductViewModal from '../../components/product-view-modal/bundle'
import {renderWithProviders} from '../../utils/test-utils'
import {act, fireEvent, screen, waitFor, within} from '@testing-library/react'
import {useDisclosure} from '@chakra-ui/react'
import {
    mockBundledProductItemsVariant,
    mockProductBundleWithVariants,
    mockProductBundle
} from '../../../mocks/product-bundle'
import {prependHandlersToServer} from '../../../jest-setup'

const MockComponent = ({updateCart}) => {
    const {open, onOpen, onClose} = useDisclosure()

    return (
        <div>
            <button onClick={onOpen}>Open Modal</button>
            <BundleProductViewModal
                updateCart={updateCart}
                onOpen={onOpen}
                onClose={onClose}
                isOpen={open}
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
            method: 'get',
            res: () => mockProductBundle
        },
        {
            path: '*/products',
            method: 'get',
            res: () => {
                // by default these bundle child are all in stock
                return mockProductBundleWithVariants
            }
        }
    ])
})

afterEach(() => {
    jest.restoreAllMocks()
})

test('renders bundle product view modal', async () => {
    const {user} = renderWithProviders(<MockComponent />)
    await waitFor(async () => {
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })
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
    const {user} = renderWithProviders(<MockComponent updateCart={handleUpdateCart} />)

    await waitFor(async () => {
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })
    })

    // click on update
    await waitFor(async () => {
        const updateButton = screen.getAllByText(/Update/)[0]
        await act(async () => {
            fireEvent.click(updateButton)
        })
    })

    expect(handleUpdateCart).toHaveBeenCalledTimes(1)
})

test('bundle product view modal disables update button when child is out of stock', async () => {
    prependHandlersToServer([
        {
            path: '*/products',
            method: 'get',
            res: () => {
                return mockProductBundleWithVariants
            }
        }
    ])
    const {user} = renderWithProviders(<MockComponent />)
    await waitFor(async () => {
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })
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
    // this is enabled since all bundle child are all in stock
    expect(updateBtn).toBeEnabled()

    let sizeSelectBtn = within(swingTankProductView).getByLabelText('M')

    expect(sizeSelectBtn).toBeInTheDocument()
    // Set up specific handlers to make size M (9MD) out of stock
    prependHandlersToServer([
        {
            path: '*/products',
            method: 'get',
            res: () => {
                // Set up inventory so that Swing Tank product M (9MD) black is out of stock
                const data = {
                    ...mockProductBundleWithVariants,
                    data: [
                        mockProductBundleWithVariants.data[0],
                        {
                            // reuse some mock data
                            ...mockProductBundleWithVariants.data[1],
                            // set up the swing tank black Medium to have out of stock inventory
                            id: '701643473915M',
                            type: {
                                variant: true
                            },
                            inventory: {
                                ats: 0,
                                backorderable: false,
                                id: 'inventory_m',
                                orderable: false,
                                preorderable: false,
                                stockLevel: 0
                            },
                            variationValues: {
                                color: 'JJ169XX',
                                size: '9MD'
                            },
                            c_color: 'JJ169XX',
                            c_isNewtest: true,
                            c_refinementColor: 'black',
                            c_size: '9MD',
                            c_width: 'Z'
                        },
                        mockProductBundleWithVariants.data[2]
                    ]
                }

                return data
            }
        }
    ])
    await act(async () => {
        // click swing tank M size
        await user.click(sizeSelectBtn)
    })

    await waitFor(() => {
        expect(within(swingTankProductView).getAllByText('M')).toHaveLength(2)
        expect(updateBtn).toBeInTheDocument()
        expect(updateBtn).toBeDisabled()
        expect(screen.getByText('Out of stock')).toBeInTheDocument()
    })
})

test('bundle product view modal disables update button when quantity exceeds child inventory', async () => {
    prependHandlersToServer([
        {
            path: '*/products',
            method: 'get',
            res: (req) => {
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
                return mockProductBundleWithVariants
            }
        }
    ])
    const {user} = renderWithProviders(<MockComponent />)
    await waitFor(async () => {
        const trigger = screen.getByText(/open modal/i)
        await act(async () => {
            await user.click(trigger)
        })
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

    await act(async () => {
        await user.clear(quantityInput)
        await user.type(quantityInput, '4')
    })

    await act(async () => {
        await user.click(sizeSelectBtn)
    })

    await waitFor(() => {
        expect(screen.getByRole('spinbutton', {name: /quantity/i})).toHaveValue('4')
        expect(within(swingTankProductView).getAllByText('L')).toHaveLength(2)
        expect(updateBtn).toBeDisabled()
        expect(screen.getByText('Only 1 left!')).toBeInTheDocument()
    })
})
