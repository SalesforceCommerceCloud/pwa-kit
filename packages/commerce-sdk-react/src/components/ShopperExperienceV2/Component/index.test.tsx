/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {Component, ComponentProps} from './index'
import {registry} from '../registry'

// Mock the registry
jest.mock('../registry', () => ({
    registry: {
        getComponent: jest.fn(),
        getFallback: jest.fn(),
        preload: jest.fn()
    }
}))

// Type the mock registry with flexible return types for testing
const mockRegistry = registry as unknown as {
    getComponent: jest.Mock
    getFallback: jest.Mock
    preload: jest.Mock
}

describe('Component', () => {
    // Create mock component data - cast to ComponentProps['component'] for test flexibility
    const mockComponent = {
        id: 'test-component-id',
        typeId: 'commerce_assets.banner',
        data: {
            title: 'Test Banner',
            imageUrl: '/test-image.jpg'
        },
        visible: true,
        localized: false,
        designMetadata: {
            name: 'Test Component'
        },
        regions: []
    } as unknown as ComponentProps['component']

    beforeEach(() => {
        jest.clearAllMocks()
        // Suppress console.log during tests
        jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('renders component when DynamicComponent is available', () => {
        const MockDynamicComponent = ({title}: {title: string}) => (
            <div data-testid="dynamic-component">{title}</div>
        )
        mockRegistry.getComponent.mockReturnValue(MockDynamicComponent)
        mockRegistry.getFallback.mockReturnValue(null)

        render(<Component component={mockComponent} regionId="test-region" />)

        expect(screen.getByTestId('dynamic-component')).toBeInTheDocument()
        expect(screen.getByText('Test Banner')).toBeInTheDocument()
    })

    test('calls preload when DynamicComponent is not available', () => {
        const preloadPromise = Promise.resolve()
        mockRegistry.getComponent.mockReturnValue(undefined)
        mockRegistry.getFallback.mockReturnValue(null)
        mockRegistry.preload.mockReturnValue(preloadPromise)

        // Component throws the preload promise for Suspense to catch
        // We can't test the throw directly because React catches it internally
        // Instead we verify preload is called with the correct typeId
        try {
            render(<Component component={mockComponent} regionId="test-region" />)
        } catch (e) {
            // Expected - Suspense boundary catches this
        }

        expect(mockRegistry.preload).toHaveBeenCalledWith('commerce_assets.banner')
    })

    test('passes correct props to DynamicComponent', () => {
        const receivedProps: Record<string, unknown> = {}
        const MockDynamicComponent = (props: Record<string, unknown>) => {
            Object.assign(receivedProps, props)
            return <div data-testid="dynamic-component">Test</div>
        }
        mockRegistry.getComponent.mockReturnValue(MockDynamicComponent)
        mockRegistry.getFallback.mockReturnValue(null)

        render(
            <Component component={mockComponent} regionId="test-region" className="custom-class" />
        )

        expect(receivedProps.title).toBe('Test Banner')
        expect(receivedProps.imageUrl).toBe('/test-image.jpg')
        expect(receivedProps.className).toBe('custom-class')
        expect(receivedProps.regionId).toBe('test-region')
        expect(receivedProps.component).toBe(mockComponent)
        expect(receivedProps.regions).toEqual([])
        expect(receivedProps.designMetadata).toEqual({
            name: 'Test Component',
            isFragment: false,
            isVisible: true,
            isLocalized: false,
            id: 'test-component-id'
        })
    })

    test('handles component without designMetadata', () => {
        const componentWithoutDesignMetadata = {
            ...mockComponent,
            designMetadata: undefined
        } as unknown as ComponentProps['component']
        const receivedProps: Record<string, unknown> = {}
        const MockDynamicComponent = (props: Record<string, unknown>) => {
            Object.assign(receivedProps, props)
            return <div data-testid="dynamic-component">Test</div>
        }
        mockRegistry.getComponent.mockReturnValue(MockDynamicComponent)
        mockRegistry.getFallback.mockReturnValue(null)

        render(<Component component={componentWithoutDesignMetadata} regionId="test-region" />)

        expect((receivedProps.designMetadata as {name: string | undefined}).name).toBeUndefined()
    })
})
