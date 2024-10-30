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
import {render, screen} from '@testing-library/react'

// Local
import {applyHOCs} from './helpers'

// Mock HOC functions
const withExtraProp = (Component: React.ComponentType<any>) => {
    const WrappedComponent = (props: any) => <Component {...props} extraProp="I am extra!" />

    // Set the display name for easier debugging
    WrappedComponent.displayName = `withExtraProp(${
        Component.displayName || Component.name || 'Component'
    })`

    return WrappedComponent
}

const withAnotherProp = (Component: React.ComponentType<any>) => {
    const WrappedComponent = (props: any) => <Component {...props} anotherProp="Another one!" />

    // Set the display name for easier debugging
    WrappedComponent.displayName = `withAnotherProp(${
        Component.displayName || Component.name || 'Component'
    })`

    return WrappedComponent
}

// Define BaseComponent as a functional component
const BaseComponent: React.FC<any> & {someStaticMethod?: jest.Mock} = ({
    extraProp,
    anotherProp
}: any) => (
    <div>
        {extraProp && <span>{extraProp}</span>}
        {anotherProp && <span>{anotherProp}</span>}
    </div>
)

BaseComponent.displayName = 'BaseComponent'

// Add the static method to BaseComponent
BaseComponent.someStaticMethod = jest.fn()

describe('applyHOCs', () => {
    test('should apply a single HOC to the component', () => {
        const WrappedComponent = applyHOCs(BaseComponent, [withExtraProp])
        render(<WrappedComponent />)

        expect(screen.getByText('I am extra!')).toBeInTheDocument()
    })

    test('should apply multiple HOCs to the component', () => {
        const WrappedComponent = applyHOCs(BaseComponent, [withExtraProp, withAnotherProp])
        render(<WrappedComponent />)

        expect(screen.getByText('I am extra!')).toBeInTheDocument()
        expect(screen.getByText('Another one!')).toBeInTheDocument()
    })

    test('should hoist non-React static methods from original component', () => {
        // Add a static method to the BaseComponent
        BaseComponent.someStaticMethod = jest.fn()

        const WrappedComponent = applyHOCs(BaseComponent, [withExtraProp])

        // The WrappedComponent should now have the static method from BaseComponent
        expect(typeof WrappedComponent.someStaticMethod).toBe('function')
    })
})
