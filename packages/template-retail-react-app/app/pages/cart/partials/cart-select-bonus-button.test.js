/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CartSelectBonusButton from '@salesforce/retail-react-app/app/pages/cart/partials/cart-select-bonus-button'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'

jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal', () => ({
    useBonusProductModalContext: jest.fn()
}))

describe('CartSelectBonusButton', () => {
    beforeEach(() => {
        useBonusProductModalContext.mockImplementation(() => ({
            onOpen: jest.fn()
        }))
    })

    it('renders with correct count text', () => {
        render(
            <CartSelectBonusButton
                handleBonusButtonClick={() => {}}
                maxOfferCount={2}
                selectedOfferCount={0}
                promotionName="Super Promo"
            />
        )

        expect(screen.getByText('Super Promo (0 of 2 selected)')).toBeInTheDocument()
    })

    it('calls the handleBonusButtonClick when clicked', async () => {
        const handleClick = jest.fn()
        const user = userEvent.setup()

        render(
            <CartSelectBonusButton
                handleBonusButtonClick={handleClick}
                maxOfferCount={1}
                selectedOfferCount={0}
                promotionName="Holiday Bonus"
            />
        )

        const button = screen.getByRole('button', {name: /select bonus products/i})
        await user.click(button)

        expect(handleClick).toHaveBeenCalled()
        expect(screen.getByText('Holiday Bonus (0 of 1 selected)')).toBeInTheDocument()
    })

    it('renders the select bonus products button', () => {
        render(
            <CartSelectBonusButton
                handleBonusButtonClick={() => {}}
                maxOfferCount={1}
                selectedOfferCount={0}
                promotionName="Spring Sale"
            />
        )

        expect(screen.getByRole('button', {name: /select bonus products/i})).toBeInTheDocument()
        expect(screen.getByText('Spring Sale (0 of 1 selected)')).toBeInTheDocument()
    })

    it('renders with correct text when maxOfferCount is 0', () => {
        render(
            <CartSelectBonusButton
                handleBonusButtonClick={() => {}}
                maxOfferCount={0}
                selectedOfferCount={0}
                promotionName="No Bonus"
            />
        )

        expect(screen.getByText('No Bonus (0 of 0 selected)')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /select bonus products/i})).toBeInTheDocument()
    })

    it('renders correctly when promotionName is not provided', () => {
        render(
            <CartSelectBonusButton
                handleBonusButtonClick={() => {}}
                maxOfferCount={3}
                selectedOfferCount={1}
            />
        )

        expect(screen.getByText('(1 of 3 selected)')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /select bonus products/i})).toBeInTheDocument()
    })
})
