/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor} from '@testing-library/react'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
const mockProductsWithUnavailableProducts = {
    limit: 0,
    total: 2,
    data: [
        {
            currency: 'GBP',
            id: '701642889830M',
            imageGroups: [],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 68
            }
        },
        {
            currency: 'GBP',
            id: '701642889829M',
            imageGroups: [],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 0
            }
        }
    ]
}
const mockProductWithUnorderableProducts = {
    limit: 0,
    total: 2,
    data: [
        {
            currency: 'GBP',
            id: '701642889831M',
            imageGroups: [],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 68
            }
        },
        {
            currency: 'GBP',
            id: '701642889828M',
            imageGroups: [],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 2
            }
        }
    ]
}

const mockProductWithLowStockProducts = {
    limit: 0,
    total: 2,
    data: [
        {
            currency: 'GBP',
            id: '701642889835M',
            imageGroups: [],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 68
            }
        },
        {
            currency: 'GBP',
            id: '701642889827M',
            imageGroups: [],
            inventory: {
                ats: 68,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 1
            }
        }
    ]
}

describe('UnavailableProductConfirmationModal', () => {
    test('renders without crashing', () => {
        prependHandlersToServer([
            {
                path: '*/products',
                res: () => {
                    return mockProductsWithUnavailableProducts
                }
            }
        ])
        expect(() => {
            renderWithProviders(<UnavailableProductConfirmationModal />)
        }).not.toThrow()
    })

    test('opens confirmation modal when unavailable products are found', async () => {
        prependHandlersToServer([
            {
                path: '*/products',
                res: () => {
                    return mockProductsWithUnavailableProducts
                }
            }
        ])
        const mockFunc = jest.fn()
        const basket = {
            productItems: [
                {
                    productId: '701642889830M',
                    quantity: 2
                },
                // unavailable product
                {
                    productId: '701642889829M',
                    quantity: 3
                }
            ]
        }
        const {getByText, queryByText, queryByRole, user} = renderWithProviders(
            <UnavailableProductConfirmationModal
                productItems={basket.productItems}
                handleUnavailableProducts={mockFunc}
            />
        )

        await waitFor(async () => {
            expect(getByText(/^Items Unavailable$/i)).toBeInTheDocument()
        })
        const removeBtn = queryByRole('button')

        expect(removeBtn).toBeInTheDocument()
        await user.click(removeBtn)
        expect(mockFunc).toHaveBeenCalled()
        await waitFor(async () => {
            expect(queryByText(/Items Unavailable/i)).not.toBeInTheDocument()
        })
        expect(removeBtn).not.toBeInTheDocument()
    })
    test('opens confirmation modal when unorderable products are found', async () => {
        prependHandlersToServer([
            {
                path: '*/products',
                res: () => {
                    return mockProductsWithUnavailableProducts
                }
            }
        ])
        const mockFunc = jest.fn()
        const basket = {
            productItems: [
                {
                    productId: '701642889831M',
                    quantity: 2
                },
                // unorderable product
                {
                    productId: '701642889828M',
                    quantity: 3
                }
            ]
        }
        const {getByText, queryByText, queryByRole, user} = renderWithProviders(
            <UnavailableProductConfirmationModal
                productItems={basket.productItems}
                handleUnavailableProducts={mockFunc}
            />
        )

        await waitFor(async () => {
            expect(getByText(/^Items Unavailable$/i)).toBeInTheDocument()
        })
        const removeBtn = queryByRole('button')

        expect(removeBtn).toBeInTheDocument()
        await user.click(removeBtn)
        expect(mockFunc).toHaveBeenCalled()
        await waitFor(async () => {
            expect(queryByText(/Items Unavailable/i)).not.toBeInTheDocument()
        })
        expect(removeBtn).not.toBeInTheDocument()
    })
    test('opens confirmation modal when stocks in basket is more than inventory stock', async () => {
        prependHandlersToServer([
            {
                path: '*/products',
                res: () => {
                    return mockProductsWithUnavailableProducts
                }
            }
        ])
        const mockFunc = jest.fn()
        const basket = {
            productItems: [
                {
                    productId: '701642889835M',
                    quantity: 2
                },
                // low stock product
                {
                    productId: '701642889827M',
                    quantity: 10
                }
            ]
        }
        const {getByText, queryByText, queryByRole, user} = renderWithProviders(
            <UnavailableProductConfirmationModal
                productItems={basket.productItems}
                handleUnavailableProducts={mockFunc}
            />
        )

        await waitFor(async () => {
            expect(getByText(/^Items Unavailable$/i)).toBeInTheDocument()
        })
        const removeBtn = queryByRole('button')

        expect(removeBtn).toBeInTheDocument()
        await user.click(removeBtn)
        expect(mockFunc).toHaveBeenCalled()
        await waitFor(async () => {
            expect(queryByText(/Items Unavailable/i)).not.toBeInTheDocument()
        })
        expect(removeBtn).not.toBeInTheDocument()
    })
})
