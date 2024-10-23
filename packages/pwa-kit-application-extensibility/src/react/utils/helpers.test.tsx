/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


// Third-Party
import React from 'react'
import {render, screen} from '@testing-library/react'

// Local
import {applyHOCs} from './helpers'

// Mock HOC functions
const withExtraProp = (Component: React.ComponentType<any>) => (props: any) =>
    <Component {...props} extraProp="I am extra!" />

const withAnotherProp = (Component: React.ComponentType<any>) => (props: any) =>
    <Component {...props} anotherProp="Another one!" />

// Mock Component
const BaseComponent = ({extraProp, anotherProp}: any) => (
    <div>
        {extraProp && <span>{extraProp}</span>}
        {anotherProp && <span>{anotherProp}</span>}
    </div>
)

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
