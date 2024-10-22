/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CurrentPrice from '@salesforce/retail-react-app/app/components/display-price/current-price'
import ListPrice from '@salesforce/retail-react-app/app/components/display-price/list-price'

describe('DisplayPrice', function () {
    const data = {
        currentPrice: 90,
        listPrice: 100,
        pricePerUnit: 90,
        isASet: false,
        isOnSale: true,
        isMaster: true,
        isRange: true
    }
    test('should render without error', () => {
        renderWithProviders(<DisplayPrice currency="GBP" priceData={data} />)
        expect(screen.getByText(/from £90\.00/i)).toBeInTheDocument()
        expect(screen.getByText(/^£100\.00$/i)).toBeInTheDocument()
    })

    test('should render according html tag for prices', () => {
        const {container} = renderWithProviders(<DisplayPrice currency="GBP" priceData={data} />)
        const currentPriceTag = container.querySelectorAll('b')
        const strikethroughPriceTag = container.querySelectorAll('s')
        expect(within(currentPriceTag[0]).getByText(/£90\.00/i)).toBeDefined()
        expect(within(strikethroughPriceTag[0]).getByText(/£100\.00/i)).toBeDefined()
        expect(currentPriceTag).toHaveLength(1)
        expect(strikethroughPriceTag).toHaveLength(1)
    })

    test('should display price according to quantity', () => {
        const {container} = renderWithProviders(
            <DisplayPrice currency="GBP" priceData={data} quantity={2} />
        )
        const currentPriceTag = container.querySelectorAll('b')
        const strikethroughPriceTag = container.querySelectorAll('s')
        expect(within(currentPriceTag[0]).getByText(/£180\.00/i)).toBeDefined()
        expect(within(strikethroughPriceTag[0]).getByText(/£200\.00/i)).toBeDefined()
        expect(currentPriceTag).toHaveLength(1)
        expect(strikethroughPriceTag).toHaveLength(1)
    })

    test('should not render list price when price is not on sale', () => {
        renderWithProviders(
            <DisplayPrice
                currency="GBP"
                priceData={{...data, currentPrice: 100, isOnSale: false}}
            />
        )
        expect(screen.queryByText(/£90\.00/i)).not.toBeInTheDocument()
        expect(screen.getByText(/From £100\.00/i)).toBeInTheDocument()
    })
})

describe('CurrentPrice', function () {
    test('should render exact price with correct aria-label', () => {
        renderWithProviders(<CurrentPrice price={100} currency="GBP" />)
        expect(screen.getByText(/^£100\.00$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/current price £100\.00/i)).toBeInTheDocument()
    })

    test('should render range price', () => {
        renderWithProviders(<CurrentPrice price={100} currency="GBP" isRange={true} />)
        expect(screen.getByText(/from £100\.00$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/from current price £100\.00/i)).toBeInTheDocument()
    })

    test('should be accessible and announce dynamic content change to screen readers', () => {
        renderWithProviders(<CurrentPrice price={100} currency="GBP" isRange={true} />)
        expect(screen.getByLabelText(/from current price £100\.00/i)).toHaveAttribute(
            'aria-live',
            'polite'
        )
    })
})

describe('ListPrice', function () {
    test('should render strikethrough price with exact price in aria-label', () => {
        const {container} = renderWithProviders(<ListPrice price={100} currency="GBP" />)
        const strikethroughPriceTag = container.querySelectorAll('s')
        expect(screen.getByLabelText(/original price £100\.00/i)).toBeInTheDocument()
        expect(within(strikethroughPriceTag[0]).getByText(/£100\.00/i)).toBeDefined()
    })

    test('should render strikethrough price with range price in aria-label', () => {
        const {container} = renderWithProviders(
            <ListPrice price={100} currency="GBP" isRange={true} />
        )
        const strikethroughPriceTag = container.querySelectorAll('s')
        expect(screen.getByLabelText(/from original price £100\.00/i)).toBeInTheDocument()
        expect(within(strikethroughPriceTag[0]).getByText(/£100\.00/i)).toBeDefined()
    })
})
