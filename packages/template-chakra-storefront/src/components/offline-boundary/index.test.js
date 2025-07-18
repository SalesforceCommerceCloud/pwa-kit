/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {ChakraProvider} from '@chakra-ui/react'
import theme from '../../theme'
import {renderWithRouter} from '../../utils/test-utils'

import OfflineBoundary, {UnwrappedOfflineBoundary} from '../../components/offline-boundary/index'

// Custom render function that combines Router and Chakra contexts
const renderWithRouterAndChakra = (component) => {
    const ComponentWithChakra = () => <ChakraProvider value={theme}>{component}</ChakraProvider>
    return renderWithRouter(<ComponentWithChakra />)
}

class ChunkLoadError extends Error {
    constructor(...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params)
        this.name = 'ChunkLoadError'
    }
}

describe('The OfflineBoundary', () => {
    beforeEach(() => {
        // React's logging is noisey even when an Error Boundary catches. Silence
        // the distracting logs during tests, since they are expected in any event.
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        console.error.mockRestore()
    })

    test('should render its children', () => {
        renderWithRouterAndChakra(
            <OfflineBoundary isOnline={true}>
                <div id="child">child</div>
            </OfflineBoundary>
        )

        expect(screen.getByText(/child/i)).toBeInTheDocument()
    })

    test('should render the error splash when a child throws a chunk load error', () => {
        const ThrowingComponent = () => {
            throw new ChunkLoadError()
        }
        renderWithRouterAndChakra(
            <OfflineBoundary isOnline={true}>
                <div>
                    <ThrowingComponent />
                    <div id="child">child</div>
                </div>
            </OfflineBoundary>
        )

        expect(screen.getByRole('img', {hidden: true})).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {name: /you are currently offline/i})
        ).toBeInTheDocument()
        expect(screen.queryByText(/child/i)).not.toBeInTheDocument()
    })

    test('should re-throw errors that are not chunk load errors', () => {
        const ThrowingComponent = () => {
            throw new Error('Anything else')
        }
        expect(() => {
            renderWithRouterAndChakra(
                <OfflineBoundary isOnline={true}>
                    <div>
                        <ThrowingComponent />
                        <div id="child">child</div>
                    </div>
                </OfflineBoundary>
            )
        }).toThrow()
    })

    test('should call clearError when retry button is clicked', async () => {
        const user = userEvent.setup()
        const ThrowingComponent = () => {
            throw new ChunkLoadError()
        }
        const clearErrorSpy = jest.spyOn(UnwrappedOfflineBoundary.prototype, 'clearError')

        renderWithRouterAndChakra(
            <OfflineBoundary isOnline={true}>
                <ThrowingComponent />
            </OfflineBoundary>
        )

        expect(screen.getByRole('img', {hidden: true})).toBeInTheDocument()
        expect(
            screen.getByRole('heading', {name: /you are currently offline/i})
        ).toBeInTheDocument()

        const retryButton = screen.getByRole('button', {name: /retry connection/i})
        await act(async () => {
            await user.click(retryButton)
        })

        expect(clearErrorSpy).toHaveBeenCalled()

        clearErrorSpy.mockRestore()
    })

    test('should derive state from a chunk load error', () => {
        const derived = UnwrappedOfflineBoundary.getDerivedStateFromError(
            new ChunkLoadError('test')
        )
        expect(derived).toEqual({chunkLoadError: true})
    })
})
