/* eslint-disable no-unused-vars */
import React from 'react'
import Checkout from './index'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import useShopper from '../../commerce-api/hooks/useShopper'

const WrappedCheckout = () => {
    useShopper()
    return <Checkout />
}

Object.defineProperty(window, 'fetch', {
    value: require('node-fetch')
})

test('Renders skeleton until customer and basket are loaded', () => {
    const {getByTestId, queryByTestId} = renderWithProviders(<Checkout />)

    expect(getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
    expect(queryByTestId('sf-checkout-container')).not.toBeInTheDocument()
})

test('Renders checkout at first step when basket and customer are loaded', async () => {
    renderWithProviders(<WrappedCheckout />)

    const rootEl = await screen.findByTestId('sf-checkout-container', {}, {timeout: 15000})

    expect(rootEl).toBeInTheDocument()
    expect(screen.getByTestId('sf-checkout-section-step-0')).toBeInTheDocument()
    expect(screen.getByTestId('sf-checkout-section-step-0-content')).not.toBeEmptyDOMElement()
    expect(screen.getByTestId('sf-checkout-section-step-1')).toBeInTheDocument()
    expect(screen.getByTestId('sf-checkout-section-step-1-content')).toBeEmptyDOMElement()
    expect(screen.getByTestId('sf-checkout-section-step-2')).toBeInTheDocument()
    expect(screen.getByTestId('sf-checkout-section-step-2-content')).toBeEmptyDOMElement()
    expect(screen.getByTestId('sf-checkout-section-step-3')).toBeInTheDocument()
    expect(screen.getByTestId('sf-checkout-section-step-3-content')).toBeEmptyDOMElement()
})

// test('Can add guest email and move to step ', async () => {
//     renderWithProviders(<WrappedCheckout />)

//     const rootEl = await screen.findByTestId('sf-checkout-container', {}, {timeout: 15000})

//     expect(rootEl).toBeInTheDocument()
// })
