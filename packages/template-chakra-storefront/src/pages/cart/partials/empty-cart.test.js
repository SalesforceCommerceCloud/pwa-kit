/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import EmptyCart from './empty-cart'

describe('EmptyCart', () => {
    it('renders empty cart message for registered users', () => {
        renderWithProviders(<EmptyCart isRegistered={true} />)
        // Check that the main empty cart message is displayed
        expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
        // Check that the registered user message is displayed
        expect(screen.getByText('Continue shopping to add items to your cart.')).toBeInTheDocument()
        // Check that the registered user message is NOT displayed
        expect(
            screen.queryByText('Sign in to retrieve your saved items or continue shopping.')
        ).not.toBeInTheDocument()
        // Check that the continue shopping button is present
        expect(screen.getByRole('link', {name: /continue shopping/i})).toBeInTheDocument()
        // Check that the sign in button is NOT present for registered users
        expect(screen.queryByRole('link', {name: /sign in/i})).not.toBeInTheDocument()
    })

    it('renders empty cart message for unregistered users', () => {
        renderWithProviders(<EmptyCart isRegistered={false} />)
        // Check that the main empty cart message is displayed
        expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
        // Check that the unregistered user message is displayed
        expect(
            screen.getByText('Sign in to retrieve your saved items or continue shopping.')
        ).toBeInTheDocument()
        // Check that the registered user message is NOT displayed
        expect(
            screen.queryByText('Continue shopping to add items to your cart.')
        ).not.toBeInTheDocument()
        // Check that the continue shopping button is present
        expect(screen.getByRole('link', {name: /continue shopping/i})).toBeInTheDocument()
        // Check that the sign in button IS present for unregistered users
        expect(screen.getByRole('link', {name: /sign in/i})).toBeInTheDocument()
    })

    it('renders empty cart message when isRegistered is undefined', () => {
        renderWithProviders(<EmptyCart />)
        // Check that the main empty cart message is displayed
        expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
        // When isRegistered is undefined/falsy, should show unregistered user message
        expect(
            screen.getByText('Sign in to retrieve your saved items or continue shopping.')
        ).toBeInTheDocument()
        // Check that the sign in button IS present when isRegistered is undefined
        expect(screen.getByRole('link', {name: /sign in/i})).toBeInTheDocument()
    })
})
