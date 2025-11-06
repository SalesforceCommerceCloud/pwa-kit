/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'
import StandardLogin from '@salesforce/retail-react-app/app/components/standard-login'
import {screen} from '@testing-library/react'

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return (
        <form>
            <StandardLogin form={form} {...props} />
        </form>
    )
}

describe('StandardLogin component', () => {
    test('renders properly', () => {
        renderWithProviders(<WrapperComponent />)

        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.queryByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Sign In'})).toBeInTheDocument()
    })

    test('renders properly when hideEmail is true', async () => {
        renderWithProviders(<WrapperComponent hideEmail={true} />)

        expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Back to Sign In Options'})).toBeInTheDocument()
    })

    test('renders social login buttons', async () => {
        renderWithProviders(<WrapperComponent isSocialEnabled={true} idps={['google', 'apple']} />)

        expect(screen.getByText(/Or Login With/)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Google/})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Apple/})).toBeInTheDocument()
    })
})
