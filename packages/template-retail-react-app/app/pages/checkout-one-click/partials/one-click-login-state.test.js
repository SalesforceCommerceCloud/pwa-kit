/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import LoginState from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-login-state'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'
import {screen} from '@testing-library/react'

const idps = ['apple', 'google']

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return <LoginState form={form} {...props} />
}

describe('LoginState', () => {
    test('renders nothing when social login is disabled', () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={false} />)

        expect(screen.queryByText('Or Login With')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Google/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Apple/i})).not.toBeInTheDocument()
    })

    test('shows social login section when enabled with idps', () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={true} idps={idps} />)

        expect(screen.getByText('Or Login With')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Google/i})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Apple/i})).toBeInTheDocument()
    })

    test('shows social login text but no buttons when enabled without idps', () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={true} idps={[]} />)

        expect(screen.getByText('Or Login With')).toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Google/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Apple/i})).not.toBeInTheDocument()
    })

    test('shows social login text but no buttons when enabled with null idps', () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={true} idps={null} />)

        expect(screen.getByText('Or Login With')).toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Google/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Apple/i})).not.toBeInTheDocument()
    })

    test('does not show anything when social login is disabled', () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={false} idps={idps} />)

        expect(screen.queryByText('Or Login With')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Google/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Apple/i})).not.toBeInTheDocument()
    })
})
