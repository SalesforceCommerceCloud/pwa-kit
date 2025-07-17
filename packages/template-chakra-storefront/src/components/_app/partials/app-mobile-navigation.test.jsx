/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import AppMobileNavigation from './app-mobile-navigation'

// Mock MobileNavigation component
jest.mock('../../mobile-navigation', () => {
    return function MockMobileNavigation(props) {
        return (
            <div data-testid="mobile-navigation">
                <div data-testid="mobile-nav-props">{JSON.stringify(props)}</div>
            </div>
        )
    }
})

describe('AppMobileNavigation', () => {
    const renderWithProviders = (component) => {
        return render(
            <ChakraProvider>
                <BrowserRouter>{component}</BrowserRouter>
            </ChakraProvider>
        )
    }

    const defaultProps = {
        categories: [
            {id: 'cat1', name: 'Category 1'},
            {id: 'cat2', name: 'Category 2'}
        ],
        isDrawerMenuOpen: false,
        onDrawerMenuClose: jest.fn(),
        onLogoClick: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders mobile navigation component', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
    })

    it('passes correct props to MobileNavigation', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const propsElement = screen.getByTestId('mobile-nav-props')
        const props = JSON.parse(propsElement.textContent)

        expect(props).toMatchObject({
            categories: defaultProps.categories,
            isDrawerMenuOpen: defaultProps.isDrawerMenuOpen
        })
    })

    it('handles open drawer state', () => {
        const props = {
            ...defaultProps,
            isDrawerMenuOpen: true
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        const propsElement = screen.getByTestId('mobile-nav-props')
        const renderedProps = JSON.parse(propsElement.textContent)

        expect(renderedProps.isDrawerMenuOpen).toBe(true)
    })

    it('handles empty categories', () => {
        const props = {
            ...defaultProps,
            categories: []
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        const propsElement = screen.getByTestId('mobile-nav-props')
        const renderedProps = JSON.parse(propsElement.textContent)

        expect(renderedProps.categories).toEqual([])
    })

    it('handles missing categories gracefully', () => {
        const props = {
            ...defaultProps,
            categories: undefined
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
    })

    it('handles missing handlers gracefully', () => {
        const props = {
            ...defaultProps,
            onDrawerMenuClose: undefined,
            onLogoClick: undefined
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
    })
})
