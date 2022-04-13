/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
// import userEvent from '@testing-library/user-event'

import OfflineBoundary from './index'
import {renderWithRouter} from '../../utils/test-utils'

// class ChunkLoadError extends Error {
//     constructor(...params) {
//         // Pass remaining arguments (including vendor specific ones) to parent constructor
//         super(...params)
//         this.name = 'ChunkLoadError'
//     }
// }

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
        renderWithRouter(
            <OfflineBoundary isOnline={true}>
                <div id="child">child</div>
            </OfflineBoundary>
        )

        expect(screen.getByText(/child/i)).toBeInTheDocument()
    })

    // test('should render the error splash when a child throws a chunk load error', () => {
    //     const ThrowingComponent = () => {
    //         throw new ChunkLoadError()
    //     }
    //     renderWithRouter(
    //         <OfflineBoundary isOnline={true}>
    //             <div>
    //                 <ThrowingComponent />
    //                 <div id="child">child</div>
    //             </div>
    //         </OfflineBoundary>
    //     )

    //     expect(screen.getByRole('img', {name: /offline cloud/i})).toBeInTheDocument()
    //     expect(
    //         screen.getByRole('heading', {name: /you are currently offline/i})
    //     ).toBeInTheDocument()
    //     expect(screen.queryByText(/child/i)).not.toBeInTheDocument()
    // })

    // test('should re-throw errors that are not chunk load errors', () => {
    //     const ThrowingComponent = () => {
    //         throw new Error('Anything else')
    //     }
    //     expect(() => {
    //         renderWithRouter(
    //             <OfflineBoundary isOnline={true}>
    //                 <div>
    //                     <ThrowingComponent />
    //                     <div id="child">child</div>
    //                 </div>
    //             </OfflineBoundary>
    //         )
    //     }).toThrow()
    // })

    // test('should attempt to reload the page when the user clicks retry', () => {
    //     let firstRender = true
    //     const ThrowingOnceComponent = () => {
    //         if (firstRender) {
    //             firstRender = false
    //             throw new ChunkLoadError()
    //         } else {
    //             return <div id="child">child</div>
    //         }
    //     }
    //     renderWithRouter(
    //         <OfflineBoundary isOnline={true}>
    //             <ThrowingOnceComponent />
    //         </OfflineBoundary>
    //     )

    //     expect(screen.getByRole('img', {name: /offline cloud/i})).toBeInTheDocument()
    //     expect(
    //         screen.getByRole('heading', {name: /you are currently offline/i})
    //     ).toBeInTheDocument()
    //     expect(screen.queryByText(/child/i)).not.toBeInTheDocument()

    //     userEvent.click(screen.getByRole('button', {name: /retry connection/i}))
    //     expect(screen.getByText(/child/i)).toBeInTheDocument()
    //     expect(screen.queryByRole('img', {name: /offline cloud/i})).not.toBeInTheDocument()
    //     expect(
    //         screen.queryByRole('heading', {name: /you are currently offline/i})
    //     ).not.toBeInTheDocument()
    // })

    // test('should derive state from a chunk load error', () => {
    //     const derived = UnwrappedOfflineBoundary.getDerivedStateFromError(
    //         new ChunkLoadError('test')
    //     )
    //     expect(derived).toEqual({chunkLoadError: true})
    // })
})
