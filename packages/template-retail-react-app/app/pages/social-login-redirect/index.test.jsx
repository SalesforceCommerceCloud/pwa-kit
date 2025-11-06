/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SocialLoginRedirect from '@salesforce/retail-react-app/app/pages/social-login-redirect/index'

test('Social Login Redirect renders without errors', () => {
    renderWithProviders(<SocialLoginRedirect />)
    expect(screen.getByText('Authenticating...')).toBeInTheDocument()
    expect(typeof SocialLoginRedirect.getTemplateName()).toBe('string')
})
