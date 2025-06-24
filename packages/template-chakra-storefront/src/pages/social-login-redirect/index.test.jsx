/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import SocialLoginRedirect from './index'
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-config')
    return {
        ...original,
        getConfig: jest.fn(() => require('../../../mock-config'))
    }
})
test('Social Login Redirect renders without errors', () => {
    renderWithProviders(<SocialLoginRedirect />)
    expect(screen.getByText('Authenticating...')).toBeInTheDocument()
    expect(typeof SocialLoginRedirect.getTemplateName()).toBe('string')
})
