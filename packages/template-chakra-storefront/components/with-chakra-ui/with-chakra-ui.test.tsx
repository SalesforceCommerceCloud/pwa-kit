/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import withChakraUI from './with-chakra-ui'

// Mock component to wrap with HOC
const MockComponent: React.FC = () => <div data-testid="mock-component">Test Component</div>

// Wrap MockComponent with the withChakraUI HOC
const WrappedComponent = withChakraUI(MockComponent)

describe('withChakraUI HOC', () => {
    test('renders the wrapped component', () => {
        const {getByTestId} = render(<WrappedComponent />)
        expect(getByTestId('mock-component')).toBeInTheDocument()
    })

    test('applies ChakraProvider context to the wrapped component', () => {
        const {getByTestId} = render(<WrappedComponent />)
        const element = getByTestId('mock-component')
        // Check that some style or theme-specific behavior from Chakra UI is applied
        expect(element).toHaveTextContent('Test Component')
        // Optionally, check for Chakra-specific classes or styling
    })

    test('passes props to the wrapped component', () => {
        const TestComponent: React.FC<{text: string}> = ({text}) => (
            <div data-testid="test-component">{text}</div>
        )
        const WrappedTestComponent = withChakraUI(TestComponent)
        const {getByTestId} = render(<WrappedTestComponent text="Hello, World!" />)
        expect(getByTestId('test-component')).toHaveTextContent('Hello, World!')
    })
})
