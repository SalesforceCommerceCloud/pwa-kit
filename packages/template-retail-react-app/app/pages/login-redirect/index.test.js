/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithReactIntl} from '../../utils/test-utils'
import LoginRedirect from './index'

test('Login Redirect renders without errors', () => {
    const {getByRole} = renderWithReactIntl(<LoginRedirect />)

    expect(getByRole('heading', {name: /login redirect/i})).toBeInTheDocument()
    expect(typeof LoginRedirect.getTemplateName()).toEqual('string')
})
