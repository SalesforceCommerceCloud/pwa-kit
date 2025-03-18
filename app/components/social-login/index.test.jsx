/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login/index'

describe('SocialLogin', () => {
    test('Load Apple', async () => {
        renderWithProviders(<SocialLogin idps={['Apple']} />)
        const button = screen.getByText('Apple')
        expect(button).toBeDefined()
    })
    test('Load Apple and Google', async () => {
        renderWithProviders(<SocialLogin idps={['Apple', 'Google']} />)
        const button = screen.getByText('Apple')
        expect(button).toBeDefined()
        const button2 = screen.getByText('Google')
        expect(button2).toBeDefined()
    })
    /* expect nothing to be rendered for an empty list */
    test('Load none', async () => {
        renderWithProviders(<SocialLogin />)
        const button = screen.queryByText('Google')
        expect(button).toBeNull()
        const button2 = screen.queryByText('Apple')
        expect(button2).toBeNull()
    })
    /* expect unknown IDPs to be skipped over */
    test('Load Unknown', async () => {
        renderWithProviders(<SocialLogin idps={['Unknown']} />)
        const button = screen.queryByText('Unknown')
        expect(button).toBeNull()
    })
})
