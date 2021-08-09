/* eslint-disable no-unused-vars */
import React, {useEffect} from 'react'
import {screen} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../../utils/test-utils'
import {keysToCamel} from '../../commerce-api/utils'
import useBasket from '../../commerce-api/hooks/useBasket'
import Cart from './index'
import userEvent from '@testing-library/user-event'
import useShopper from '../../commerce-api/hooks/useShopper'
import {Button} from '@chakra-ui/button'
import {
    ocapiBasketResponse,
    ocapiBasketWithItem,
    ocapiBasketWithPaymentInstrumentAndBillingAddress
} from '../../commerce-api/mock-data'

Object.defineProperty(window, 'fetch', {
    value: require('node-fetch')
})
const serverToReturnCartItems = setupServer(
    rest.post('*/baskets*', (req, res, ctx) => {
        return res(ctx.json(keysToCamel(ocapiBasketWithItem)))
    }),

    rest.get('*/baskets*', (req, res, ctx) => {
        return res(ctx.json(keysToCamel(ocapiBasketWithItem)))
    })
)

const serverToReturnNoItems = setupServer(
    rest.post('*/baskets*', (req, res, ctx) => {
        return res(ctx.json(keysToCamel(ocapiBasketResponse)))
    }),

    rest.get('*/baskets*', (req, res, ctx) => {
        return res(ctx.json(keysToCamel(ocapiBasketResponse)))
    })
)

const WrappedCart = () => {
    const basket = useBasket()
    useEffect(() => {
        basket.getOrCreateBasket()
    }, [])
    return <Cart />
}

// Set up and clean up
beforeAll(() => {
    jest.resetModules()
})
afterEach(() => {
    localStorage.clear()
})

describe('test Cart with Items', () => {
    beforeAll(() => serverToReturnCartItems.listen())
    afterEach(() => serverToReturnCartItems.resetHandlers())
    afterAll(() => serverToReturnCartItems.close())
    test('Renders skeleton until customer and basket are loaded', () => {
        const {getByTestId, queryByTestId} = renderWithProviders(<Cart />)

        expect(getByTestId('sf-cart-skeleton')).toBeInTheDocument()
        expect(queryByTestId('sf-cart-container')).not.toBeInTheDocument()
    })

    test('Renders cart components when there are items', async () => {
        renderWithProviders(<WrappedCart />)
        const cart = await screen.findByTestId('sf-cart-container', {}, {timeout: 15000})
        const cartItem = await screen.findByTestId('sf-cart-item', {}, {timeout: 15000})
        expect(cart).toBeInTheDocument()
    })
})

describe('test Cart without Items', () => {
    beforeAll(() => serverToReturnNoItems.listen())
    afterEach(() => serverToReturnNoItems.resetHandlers())
    afterAll(() => serverToReturnNoItems.close())
    test('Renders empty cart when there are no items', async () => {
        renderWithProviders(<WrappedCart />)
        const emptyCart = await screen.findByTestId('sf-cart-empty', {}, {timeout: 15000})
        expect(emptyCart).toBeInTheDocument()
    })
})

// test('Can add guest email and move to step ', async () => {
//     renderWithProviders(<WrappedCheckout />)

//     const rootEl = await screen.findByTestId('sf-checkout-container', {}, {timeout: 15000})

//     expect(rootEl).toBeInTheDocument()
// })
