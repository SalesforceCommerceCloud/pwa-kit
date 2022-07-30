/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import user from '@testing-library/user-event'
import useNavigation from './use-navigation'
import mockConfig from '../../config/mocks/default'
import {renderWithProviders} from '../utils/test-utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
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
    jest.clearAllMocks()
    const originalLocation = window.location

    // Restore `window.location` to the `jsdom` `Location` object
    window.location = originalLocation
})

const TestComponent = () => {
    const navigate = useNavigation()

    return (
        <div>
            <button data-testid="page1-link" onClick={() => navigate('/page1')} />
            <button data-testid="page2-link" onClick={() => navigate('/page2', 'replace', {})} />
            <button data-testid="page4-link" onClick={() => navigate('/')} />
        </div>
    )
}

test('prepends locale and site and calls history.push', () => {
    getConfig.mockImplementation(() => mockConfig)
    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/uk/en-GB/page1')
})

test('append locale as path and site as query and calls history.push', () => {
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
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/en-GB/page1?site=uk')
})

test('works for any history method and args', () => {
    getConfig.mockImplementation(() => mockConfig)

    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    user.click(getByTestId('page2-link'))
    expect(mockHistoryReplace).toHaveBeenCalledWith('/uk/en-GB/page2', {})
})

test('if given the path to root or homepage, will not prepend the locale', () => {
    getConfig.mockImplementation(() => mockConfig)

    const {getByTestId} = renderWithProviders(<TestComponent />, {
        wrapperProps: {siteAlias: 'us', locale: 'en-US'}
    })
    user.click(getByTestId('page4-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/')
})
