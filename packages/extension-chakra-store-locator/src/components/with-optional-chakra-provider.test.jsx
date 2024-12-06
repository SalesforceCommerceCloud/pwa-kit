/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {withOptionalChakra} from './with-optional-chakra-provider'
import PropTypes from 'prop-types'

jest.mock('@chakra-ui/react', () => ({
    useTheme: jest.fn(),
    // eslint-disable-next-line react/prop-types
    ChakraProvider: ({children}) => <div>{children}</div>
}))

describe('withOptionalChakra', () => {
    const TestComponent = () => <div>Test Component</div>
    const mockTheme = {}

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('wraps component with ChakraProvider when no provider exists', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {useTheme} = require('@chakra-ui/react')
        useTheme.mockReturnValue({})

        const WrappedComponent = withOptionalChakra(TestComponent, mockTheme)
        render(<WrappedComponent />)

        expect(screen.getByText('Test Component')).toBeTruthy()
    })

    it('passes props to wrapped component', () => {
        const TestComponentWithProps = ({testProp}) => <div>{testProp}</div>
        TestComponentWithProps.propTypes = {
            testProp: PropTypes.string
        }

        const WrappedComponent = withOptionalChakra(TestComponentWithProps, mockTheme)
        render(<WrappedComponent testProp="test value" />)

        expect(screen.getByText('test value')).toBeTruthy()
    })
})
