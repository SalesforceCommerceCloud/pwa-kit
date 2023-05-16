/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import Throw404 from './index'
import * as errors from '../../errors'

describe('Throw404', () => {
    test('Renders correctly', () => {
        render(<Throw404 />)
        const content = document.querySelector('body').firstElementChild.innerHTML
        expect(content).toBe('<div></div>')
    })

    test('Throws on getProps', () => {
        expect(() => Throw404.getProps()).toThrow(errors.HTTPNotFound)
    })
})
