/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */

// Third-Party
import React from 'react'
import {render} from '@testing-library/react'

// Local
import withApplicationExtensions from './withApplicationExtensions'
import {getApplicationExtensions} from '../placeholders/application-extensions'
import {applyHOCs} from '../utils'
import {ApplicationExtension} from '../classes/ApplicationExtension'

// Types
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'

// Mock getApplicationExtensions
jest.mock('../placeholders/application-extensions', () => ({
    getApplicationExtensions: jest.fn()
}))

// Mock applyHOCs
jest.mock('../utils', () => ({
    applyHOCs: jest.fn()
}))

// Sample mock extension
class MockExtension extends ApplicationExtension<ApplicationExtensionConfigBase> {
    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        const EnhancedComponent: React.FC<T> = (props) => (
            <div data-testid="mock-extension">
                <App {...props} />
            </div>
        )
        return EnhancedComponent
    }
}

// Sample WrappedComponent for testing
const WrappedComponent: React.FC = () => <div data-testid="wrapped-component">Wrapped</div>

describe('withApplicationExtensions HOC', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should apply enabled extensions to WrappedComponent', async () => {
        // Mock enabled extensions
        const mockExtensions = [new MockExtension({enabled: true})]
        ;(getApplicationExtensions as jest.Mock).mockResolvedValue(mockExtensions)

        await getApplicationExtensions()
        // Mock applyHOCs behavior
        ;(applyHOCs as jest.Mock).mockImplementation((Component, hocs) =>
            hocs.reduce((Acc: any, hoc: any) => hoc(Acc), Component)
        )

        // Execute HOC
        const EnhancedComponent = withApplicationExtensions(WrappedComponent, {
            applicationExtensions: mockExtensions
        })

        // Render the enhanced component
        const {getByTestId} = render(<EnhancedComponent />)

        // Verify the result
        expect(getApplicationExtensions).toHaveBeenCalledTimes(1)
        expect(applyHOCs).toHaveBeenCalledWith(WrappedComponent, expect.any(Array))
        expect(getByTestId('mock-extension')).toBeInTheDocument()
        expect(getByTestId('wrapped-component')).toBeInTheDocument()
    })

    test('should not apply disabled extensions to WrappedComponent', async () => {
        // Mock disabled extensions
        const mockExtensions = [new MockExtension({enabled: false})]
        ;(getApplicationExtensions as jest.Mock).mockResolvedValue(mockExtensions)

        await getApplicationExtensions()
        const EnhancedComponent = withApplicationExtensions(WrappedComponent, {
            applicationExtensions: mockExtensions
        })

        // Render the enhanced component
        const {getByTestId} = render(<EnhancedComponent />)

        // Verify the result
        expect(getApplicationExtensions).toHaveBeenCalledTimes(1)
        expect(applyHOCs).toHaveBeenCalledWith(WrappedComponent, [])
        expect(getByTestId('wrapped-component')).toBeInTheDocument()
    })

    test('should populate locals if options.locals is provided', () => {
        const mockExtensions = [new MockExtension({enabled: true})]
        ;(getApplicationExtensions as jest.Mock).mockResolvedValue(mockExtensions)

        const locals: any = {}
        withApplicationExtensions(WrappedComponent, {
            applicationExtensions: mockExtensions,
            locals
        })

        expect(locals.applicationExtensions).toEqual(mockExtensions)
    })

    test('should return the WrappedComponent unmodified if no extensions are enabled', () => {
        ;(getApplicationExtensions as jest.Mock).mockResolvedValue([])
        ;(applyHOCs as jest.Mock).mockImplementation((Component) => Component)

        const EnhancedComponent = withApplicationExtensions(WrappedComponent, {
            applicationExtensions: []
        })

        const {getByTestId} = render(<EnhancedComponent />)

        // expect(getApplicationExtensions).toHaveBeenCalledTimes(1)
        expect(getByTestId('wrapped-component')).toBeInTheDocument()
    })
})
