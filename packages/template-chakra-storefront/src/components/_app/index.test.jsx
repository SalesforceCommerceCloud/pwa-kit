/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {BrowserRouter} from 'react-router-dom'
import App from './index'

// Mock all custom hooks
jest.mock('./hooks', () => ({
    useAppConfig: jest.fn(() => ({
        appConfig: {name: 'Test App'},
        styles: {container: {}},
        themeColor: '#000000'
    })),
    useAppData: jest.fn(() => ({
        categories: [],
        customer: null,
        basket: null
    })),
    useAppAuth: jest.fn(() => ({
        getTokenWhenReady: jest.fn(),
        authModal: null
    })),
    useAppLocalization: jest.fn(() => ({
        targetLocale: 'en-US',
        messages: {},
        site: {id: 'test-site'},
        locale: {id: 'en-US'},
        buildUrl: jest.fn(),
        currency: 'USD',
        appOrigin: 'https://example.com'
    })),
    useAppNavigation: jest.fn(() => ({
        onLogoClick: jest.fn(),
        onCartClick: jest.fn(),
        onAccountClick: jest.fn(),
        onWishlistClick: jest.fn()
    })),
    useAppModals: jest.fn(() => ({
        isDrawerMenuOpen: false,
        onDrawerMenuOpen: jest.fn(),
        onDrawerMenuClose: jest.fn(),
        isOpenStoreLocator: false,
        onOpenStoreLocator: jest.fn(),
        onCloseStoreLocator: jest.fn(),
        dntNotification: null
    })),
    useAppBasket: jest.fn(),
    useAppOnlineStatus: jest.fn(() => ({isOnline: true})),
    useAppAnalytics: jest.fn()
}))

// Mock external hook
jest.mock('../../hooks/use-update-shopper-context', () => ({
    useUpdateShopperContext: jest.fn()
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn(() => ({pathname: '/home'}))
}))

// Mock all partials components
jest.mock('./partials', () => ({
    AppProviders: jest.fn(({children}) => <div data-testid="app-providers">{children}</div>),
    AppSEO: jest.fn(() => <div data-testid="app-seo">SEO</div>),
    AppHeader: jest.fn(() => <div data-testid="app-header">Header</div>),
    AppFooter: jest.fn(() => <div data-testid="app-footer">Footer</div>),
    AppModals: jest.fn(() => <div data-testid="app-modals">Modals</div>),
    AppLayout: jest.fn(({children, headerComponent, footerComponent, modalsComponent}) => (
        <div data-testid="app-layout">
            {headerComponent}
            {children}
            {footerComponent}
            {modalsComponent}
        </div>
    ))
}))

describe('App', () => {
    const renderApp = (children = <div data-testid="app-children">Test Children</div>) => {
        return render(
            <BrowserRouter>
                <App>{children}</App>
            </BrowserRouter>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        renderApp()

        expect(screen.getByTestId('app-providers')).toBeInTheDocument()
        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('renders all main components', () => {
        renderApp()

        expect(screen.getByTestId('app-providers')).toBeInTheDocument()
        expect(screen.getByTestId('app-seo')).toBeInTheDocument()
        expect(screen.getByTestId('app-header')).toBeInTheDocument()
        expect(screen.getByTestId('app-footer')).toBeInTheDocument()
        expect(screen.getByTestId('app-modals')).toBeInTheDocument()
        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('renders children correctly', () => {
        renderApp()

        expect(screen.getByTestId('app-children')).toBeInTheDocument()
    })

    it('handles custom children', () => {
        const customChildren = <div data-testid="custom-content">Custom Content</div>
        renderApp(customChildren)

        expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    })

    it('applies correct CSS class to root container', () => {
        renderApp()

        const container = document.querySelector('.sf-app')
        expect(container).toBeInTheDocument()
    })

    it('handles checkout page location', () => {
        const {useLocation} = require('react-router-dom')
        useLocation.mockReturnValue({pathname: '/checkout'})

        renderApp()

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })

    it('uses all required hooks', () => {
        const hooks = require('./hooks')

        renderApp()

        expect(hooks.useAppConfig).toHaveBeenCalled()
        expect(hooks.useAppData).toHaveBeenCalled()
        expect(hooks.useAppAuth).toHaveBeenCalled()
        expect(hooks.useAppLocalization).toHaveBeenCalled()
        expect(hooks.useAppNavigation).toHaveBeenCalled()
        expect(hooks.useAppModals).toHaveBeenCalled()
        expect(hooks.useAppBasket).toHaveBeenCalled()
        expect(hooks.useAppOnlineStatus).toHaveBeenCalled()
        expect(hooks.useAppAnalytics).toHaveBeenCalled()
    })

    it('passes correct props to AppProviders', () => {
        const {AppProviders} = require('./partials')

        renderApp()

        expect(AppProviders).toHaveBeenCalledWith(
            expect.objectContaining({
                getTokenWhenReady: expect.any(Function),
                targetLocale: 'en-US',
                messages: expect.any(Object),
                currency: 'USD'
            }),
            expect.anything()
        )
    })

    it('handles missing children gracefully', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        )

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })
})
