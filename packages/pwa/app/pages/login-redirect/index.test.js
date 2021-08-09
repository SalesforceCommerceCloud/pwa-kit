/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {renderWithReactIntl} from '../../utils/test-utils'
import LoginRedirect from './index'

test('Login Redirect renders without errors', () => {
    const {getByRole} = renderWithReactIntl(<LoginRedirect />)

    expect(getByRole('heading', {name: /login redirect/i})).toBeInTheDocument()
    expect(typeof LoginRedirect.getTemplateName()).toEqual('string')
})
