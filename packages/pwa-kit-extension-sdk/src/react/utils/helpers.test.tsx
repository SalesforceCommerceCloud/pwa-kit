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
import {applyHOCs, cacheMethodResult, isServerSide, NOT_CACHED} from './helpers'

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

class TestClass {
    _cache: any
    methodName: () => any

    constructor(methodImplementation: () => any) {
        this._cache = undefined
        this.methodName = methodImplementation
    }
}

describe('cacheMethodResult', () => {
    let instance: TestClass
    let methodMock: jest.Mock

    beforeEach(() => {
        methodMock = jest.fn().mockImplementation(() => 'result')
        instance = new TestClass(methodMock)
    })

    it('should not cache if method does not exist', () => {
        cacheMethodResult(instance, 'nonExistentMethod', '_cache')
        expect(instance._cache).toBeUndefined()

        const uncachedMethodCall = instance.methodName()
        expect(uncachedMethodCall).toBe('result')
        expect(instance._cache).toBeUndefined()
    })

    it('should cache the result of a sync method', () => {
        cacheMethodResult(instance, 'methodName', '_cache')
        expect(instance._cache).toBe(NOT_CACHED)

        const firstCall = instance.methodName()
        expect(firstCall).toBe('result')
        expect(instance._cache).toBe('result')
        expect(methodMock).toHaveBeenCalledTimes(1)

        const secondCall = instance.methodName()
        expect(secondCall).toBe('result')
        expect(methodMock).toHaveBeenCalledTimes(1) // Should not call the original method again
    })

    it('should cache the result of an async method', async () => {
        methodMock = jest.fn().mockResolvedValue('async result')
        instance = new TestClass(methodMock)

        cacheMethodResult(instance, 'methodName', '_cache')
        expect(instance._cache).toBe(NOT_CACHED)

        await expect(instance.methodName()).resolves.toBe('async result')
        await expect(instance._cache).resolves.toBe('async result')
        expect(methodMock).toHaveBeenCalledTimes(1)

        const secondCall = instance.methodName()
        await expect(secondCall).resolves.toBe('async result')
        expect(methodMock).toHaveBeenCalledTimes(1) // Should not call the original method again
    })

    it('should not override the method if it is not a function', () => {
        ;(instance as any).methodName = 'not a function'
        cacheMethodResult(instance, 'methodName', '_cache')
        expect(instance.methodName).toBe('not a function') // Should remain unchanged
    })
})

describe('isServerSide', () => {
    afterEach(() => {
        delete (global as any).window
    })

    it('should return true when window is undefined (server-side)', () => {
        delete (global as any).window
        expect(isServerSide()).toBe(true)
    })

    it('should return false when window is defined (client-side)', () => {
        ;(global as any).window = {}
        expect(isServerSide()).toBe(false)
    })
})
