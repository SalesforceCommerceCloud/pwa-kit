/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {mockOrderHistory, mockOrderProducts} from '../../mocks/mock-data'
import Orders from './orders'
import mockConfig from '../../../config/mocks/default'
import {createServer} from '../../../jest-setup'

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/account/orders')}>
                <Orders />
            </Route>
        </Switch>
    )
}

// Set up and clean up
beforeEach(() => {
    window.history.pushState({}, 'Account', createPathWithDefaults('/account/orders'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

describe('Order account page', function () {
    const {prependHandlersToServer} = createServer()

    test('Renders order history and details', async () => {
        prependHandlersToServer([
            {
                path: '*/orders/:orderNo',
                res: () => {
                    return mockOrderHistory.data[0]
                }
            },
            {
                path: '*/customers/:customerId/orders',
                res: () => {
                    return mockOrderHistory
                }
            },
            {
                path: '*/products',
                res: () => {
                    return mockOrderProducts
                }
            }
        ])
        await renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })
        expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
        expect(await screen.findAllByText(/Ordered: /i)).toHaveLength(3)
        expect(
            await screen.findAllByAltText(
                'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
                {},
                {timeout: 15000}
            )
        ).toHaveLength(3)

        user.click((await screen.findAllByText(/view details/i))[0])
        expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
        expect(await screen.findByText(/order number: 00028011/i)).toBeInTheDocument()
        expect(
            await screen.findByAltText(/Pleated Bib Long Sleeve Shirt, Silver Grey, small/i)
        ).toBeInTheDocument()
        expect(
            await screen.findByAltText(/Long Sleeve Crew Neck, Fire Red, small/i)
        ).toBeInTheDocument()
    })

    test('Renders order history place holder when no orders', async () => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId/orders',
                res: () => {
                    return {limit: 0, offset: 0, total: 0}
                }
            }
        ])
        await renderWithProviders(<MockedComponent history={history} />, {
            wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
        })

        expect(await screen.findByTestId('account-order-history-place-holder')).toBeInTheDocument()
    })
})
