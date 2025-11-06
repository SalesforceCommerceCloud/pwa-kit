/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import PasswordlessEmailConfirmation from '@salesforce/retail-react-app/app/components/email-confirmation/index'
import {useForm} from 'react-hook-form'

const WrapperComponent = ({...props}) => {
    const form = useForm()
    return <PasswordlessEmailConfirmation form={form} {...props} />
}

test('renders PasswordlessEmailConfirmation component with passed email', () => {
    const email = 'test@salesforce.com'
    renderWithProviders(<WrapperComponent email={email} />)
    expect(screen.getByText(email)).toBeInTheDocument()
})
