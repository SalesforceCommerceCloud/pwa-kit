/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import MaintenanceError from '@salesforce/retail-react-app/app/components/maintenance-error/index'
import {getRouterBasePath} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
// !!! ----- WARNING ----- WARNING ----- WARNING ----- !!!
// Tests use render instead of renderWithProviders because
// error component is rendered outside provider tree
// !!! ----------------------------------------------- !!!
import {screen, render, waitFor, act} from '@testing-library/react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/utils', () => ({
    getRouterBasePath: jest.fn(() => '')
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            pages: {
                maintenancePage: {
                    sharedMaintenancePage: false,
                    cdnUrl: '',
                    forwardedHost: ''
                }
            }
        }
    }))
}))

const originalLocation = window.location
const originalFetch = global.fetch

afterEach(() => {
    window.location = originalLocation
    global.fetch = originalFetch
    jest.resetAllMocks()
})

test('MaintenanceError renders without errors', async () => {
    await act(async () => {
        expect(render(<MaintenanceError />)).toBeDefined()
    })
})

test('renders built-in message when sharedMaintenancePage is false', async () => {
    await act(async () => {
        render(<MaintenanceError />)
    })
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Site under maintenance')
    expect(screen.getByText(/scheduled maintenance/i)).toBeInTheDocument()
})

test('clicking logo navigates to home', async () => {
    delete window.location
    window.location = {href: ''}
    await act(async () => {
        render(<MaintenanceError />)
    })
    screen.getByLabelText('logo').click()
    expect(window.location.href).toBe('/')
})

test('clicking logo navigates to base path when set', async () => {
    delete window.location
    window.location = {href: ''}
    getRouterBasePath.mockReturnValueOnce('/my-base')
    await act(async () => {
        render(<MaintenanceError />)
    })
    screen.getByLabelText('logo').click()
    expect(window.location.href).toBe('/my-base/')
})

test('renders CDN html content when sharedMaintenancePage is true and fetch succeeds', async () => {
    getConfig.mockReturnValue({
        app: {
            pages: {
                maintenancePage: {
                    sharedMaintenancePage: true,
                    cdnUrl: 'https://cdn.example.com/maintenance',
                    forwardedHost: 'example.com'
                }
            }
        }
    })
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><body><p>CDN maintenance content</p></body></html>')
        })
    )

    await act(async () => {
        render(<MaintenanceError />)
    })

    await waitFor(() => {
        expect(screen.getByText('CDN maintenance content')).toBeInTheDocument()
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/maintenance-page')
})

test('renders built-in message when sharedMaintenancePage is true but fetch fails', async () => {
    getConfig.mockReturnValue({
        app: {
            pages: {
                maintenancePage: {
                    sharedMaintenancePage: true,
                    cdnUrl: 'https://cdn.example.com/maintenance',
                    forwardedHost: 'example.com'
                }
            }
        }
    })
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

    await act(async () => {
        render(<MaintenanceError />)
    })

    await waitFor(() => {
        expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Site under maintenance')
    })
})

test('renders built-in message when sharedMaintenancePage is true but fetch returns non-ok', async () => {
    getConfig.mockReturnValue({
        app: {
            pages: {
                maintenancePage: {
                    sharedMaintenancePage: true,
                    cdnUrl: 'https://cdn.example.com/maintenance',
                    forwardedHost: 'example.com'
                }
            }
        }
    })
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: false,
            text: () => Promise.resolve('')
        })
    )

    await act(async () => {
        render(<MaintenanceError />)
    })

    await waitFor(() => {
        expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Site under maintenance')
    })
})
