/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withLegacyGetProps} from './index'
import {render, screen} from '@testing-library/react'
import React from 'react'

describe('withLegacyGetProps', function () {
    test('Renders correctly', () => {
        const Wrapped = () => <p>Hello world</p>
        const Component = withLegacyGetProps(Wrapped)
        render(<Component locals={{}} />)
        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
    })

    test(`Has working getInitializers method`, () => {
        expect(withLegacyGetProps({}).getInitializers()).toHaveLength(1)
        expect(withLegacyGetProps({getInitializers: () => ['xyz']}).getInitializers()).toHaveLength(
            2
        )
    })

    test(`Has working getHOCsInUse method`, () => {
        expect(withLegacyGetProps({}).getHOCsInUse()).toHaveLength(1)
        expect(withLegacyGetProps({getHOCsInUse: () => ['xyz']}).getHOCsInUse()).toHaveLength(2)
    })
})
