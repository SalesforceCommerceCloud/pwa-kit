/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withReactQuery} from './index'
import {render, screen} from '@testing-library/react'
import React from 'react'
import logger from '../../../../utils/logger-instance'

jest.mock('../../../../utils/logger-instance', () => {
    return {
        error: jest.fn()
    }
})

describe('withReactQuery', function () {
    let windowSpy
    let oldPreloadedState = window.__PRELOADED_STATE__

    beforeEach(() => {
        windowSpy = jest.spyOn(window, 'window', 'get')
        jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    })

    afterEach(() => {
        console.warn.mockRestore()
        windowSpy.mockRestore()

        window.__PRELOADED_STATE__ = oldPreloadedState
    })

    test('Renders correctly', () => {
        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped)
        render(<Component locals={{}} />)

        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
    })

    test('`beforeHydrate` called on mount', () => {
        const mockPreloadedState = {payload: {}}
        const mockBeforeHydrate = jest.fn()

        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped, {
            beforeHydrate: mockBeforeHydrate
        })

        window.__PRELOADED_STATE__ = {__reactQuery: mockPreloadedState}
        render(<Component locals={{}} />)

        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
        expect(mockBeforeHydrate).toHaveBeenCalledTimes(1)
        expect(mockBeforeHydrate).toHaveBeenCalledWith(mockPreloadedState)
    })

    test('Renders correctly when `beforeHydrate` throws', () => {
        const mockPreloadedState = {payload: {}}
        const mockError = new Error('Test Error')
        const mockBeforeHydrate = jest.fn().mockImplementation(() => {
            throw mockError
        })

        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped, {
            beforeHydrate: mockBeforeHydrate
        })

        window.__PRELOADED_STATE__ = {__reactQuery: mockPreloadedState}
        logger.error = jest.fn()
        render(<Component locals={{}} />)

        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
        expect(mockBeforeHydrate).toHaveBeenCalledTimes(1)
        expect(mockBeforeHydrate).toHaveBeenCalledWith(mockPreloadedState)
        expect(logger.error).toHaveBeenCalledTimes(1)
        expect(logger.error).toHaveBeenCalledWith('Client `beforeHydrate` failed', {
            additionalProperties: {error: mockError},
            namespace: 'with-react-query.render'
        })
    })

    test(`Has working getInitializers method`, () => {
        expect(withReactQuery({}).getInitializers()).toHaveLength(1)
        expect(withReactQuery({getInitializers: () => ['xyz']}).getInitializers()).toHaveLength(2)
    })

    test(`Has working getHOCsInUse method`, () => {
        expect(withReactQuery({}).getHOCsInUse()).toHaveLength(1)
        expect(withReactQuery({getHOCsInUse: () => ['xyz']}).getHOCsInUse()).toHaveLength(2)
    })
})
