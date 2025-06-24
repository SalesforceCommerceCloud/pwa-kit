/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, act} from '@testing-library/react'
import {
    StoreLocatorProvider,
    StoreLocatorContext
} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'

describe('StoreLocatorProvider', () => {
    const mockConfig = {
        defaultCountryCode: 'US',
        defaultPostalCode: '10178'
    }

    it('provides the expected context value', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <StoreLocatorProvider config={mockConfig}>
                <TestComponent />
            </StoreLocatorProvider>
        )

        expect(contextValue).toBeTruthy()
        expect(contextValue?.state).toEqual({
            mode: 'input',
            formValues: {
                countryCode: mockConfig.defaultCountryCode,
                postalCode: mockConfig.defaultPostalCode
            },
            deviceCoordinates: {
                latitude: null,
                longitude: null
            },
            config: mockConfig
        })
        expect(typeof contextValue?.setState).toBe('function')
    })

    it('updates state correctly when setState is called', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(StoreLocatorContext)
            return null
        }

        render(
            <StoreLocatorProvider config={mockConfig}>
                <TestComponent />
            </StoreLocatorProvider>
        )

        act(() => {
            contextValue?.setState((prev) => ({
                ...prev,
                mode: 'device',
                formValues: {
                    countryCode: 'US',
                    postalCode: '94105'
                }
            }))
        })

        expect(contextValue?.state.mode).toBe('device')
        expect(contextValue?.state.formValues).toEqual({
            countryCode: 'US',
            postalCode: '94105'
        })
    })

    it('renders children correctly', () => {
        const TestChild = () => <div data-testid="test-child">Test Child</div>

        const {getByText} = render(
            <StoreLocatorProvider config={mockConfig}>
                <TestChild />
            </StoreLocatorProvider>
        )

        expect(getByText('Test Child')).toBeTruthy()
    })
})
