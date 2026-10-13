/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import userEvent from '@testing-library/user-event'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn()
    }
})

const mockHistoryPush = jest.fn()
const mockHistoryReplace = jest.fn()

jest.mock('react-router', () => {
    const original = jest.requireActual('react-router')

    return {
        ...original,
        useHistory: jest.fn().mockImplementation(() => {
            return {
                push: mockHistoryPush,
                replace: mockHistoryReplace
            }
        })
    }
})

afterEach(() => {
    jest.resetModules()
})

const TestComponent = () => {
    const navigate = useNavigation()

    return (
        <div>
            <button data-testid="page1-link" onClick={() => navigate('/page1')} />
            <button data-testid="page2-link" onClick={() => navigate('/page2', 'replace', {})} />
            <button data-testid="page4-link" onClick={() => navigate('/')} />
            <button
                data-testid="search-link"
                onClick={() => navigate('/search?site=uk&locale=en-GB&q=boots')}
            />
            <button
                data-testid="product-link"
                onClick={() => navigate('/product/123?pid=456#reviews')}
            />
        </div>
    )
}

test('prepends locale and site and calls history.push', async () => {
    const user = userEvent.setup()

    getConfig.mockImplementation(() => mockConfig)
    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    await user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/uk/en-GB/page1')
})

test('append locale as path and site as query and calls history.push', async () => {
    const user = userEvent.setup()

    const newConfig = {
        ...mockConfig,
        app: {
            ...mockConfig.app,
            url: {
                locale: 'path',
                site: 'query_param',
                showDefaults: true
            }
        }
    }
    getConfig.mockImplementation(() => newConfig)
    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: newConfig.app}
    })
    await user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/en-GB/page1?site=uk')
})

test('works for any history method and args', async () => {
    const user = userEvent.setup()

    getConfig.mockImplementation(() => mockConfig)

    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await user.click(getByTestId('page2-link'))
    expect(mockHistoryReplace).toHaveBeenCalledWith('/uk/en-GB/page2', {})
})

test('if given the path to root or homepage, will not prepend the locale', async () => {
    const user = userEvent.setup()

    getConfig.mockImplementation(() => mockConfig)

    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'us', locale: 'en-US'}
    })
    await user.click(getByTestId('page4-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/')
})

describe('with site and locale as query params', () => {
    const queryParamConfig = {
        ...mockConfig,
        app: {
            ...mockConfig.app,
            url: {
                locale: 'query_param',
                site: 'query_param',
                showDefaults: true
            }
        }
    }

    beforeEach(() => {
        getConfig.mockImplementation(() => queryParamConfig)
    })

    test('merges site/locale into a path that already has a query', async () => {
        const user = userEvent.setup()
        const {getByTestId} = renderWithProviders(<TestComponent />, {
            wrapperProps: {siteAlias: 'uk', appConfig: queryParamConfig.app}
        })

        await user.click(getByTestId('search-link'))

        const pushed = mockHistoryPush.mock.calls.at(-1)[0]
        expect(pushed).toBe('/search?q=boots&site=uk&locale=en-GB')
        expect(pushed.split('?')).toHaveLength(2)
        const {searchParams} = new URL(pushed, 'http://storefront.local')
        expect(searchParams.get('q')).toBe('boots')
        expect(searchParams.getAll('site')).toEqual(['uk'])
        expect(searchParams.getAll('locale')).toEqual(['en-GB'])
    })

    test('keeps existing params and the hash intact', async () => {
        const user = userEvent.setup()
        const {getByTestId} = renderWithProviders(<TestComponent />, {
            wrapperProps: {siteAlias: 'uk', appConfig: queryParamConfig.app}
        })

        await user.click(getByTestId('product-link'))

        const pushed = mockHistoryPush.mock.calls.at(-1)[0]
        expect(pushed).toBe('/product/123?pid=456&site=uk&locale=en-GB#reviews')
        const {searchParams, hash} = new URL(pushed, 'http://storefront.local')
        expect(searchParams.get('pid')).toBe('456')
        expect(hash).toBe('#reviews')
    })
})
