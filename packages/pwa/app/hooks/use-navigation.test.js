/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import user from '@testing-library/user-event'
import useNavigation from './use-navigation'
import {getUrlConfig, getSitesConfig, getDefaultSiteId} from '../utils/utils'
import {useLocation} from 'react-router-dom'
import {render} from '@testing-library/react'
import useSite from './use-site'

const mockHistoryPush = jest.fn()
const mockHistoryReplace = jest.fn()

jest.mock('../utils/utils', () => {
    const original = jest.requireActual('../utils/utils')
    return {
        ...original,
        getUrlConfig: jest.fn(),
        getSitesConfig: jest.fn(),
        getDefaultSiteId: jest.fn()
    }
})

jest.mock('./use-site')
jest.mock('react-router', () => {
    return {
        useHistory: jest.fn().mockImplementation(() => {
            return {
                push: mockHistoryPush,
                replace: mockHistoryReplace
            }
        })
    }
})

jest.mock('react-router-dom', () => {
    const original = jest.requireActual('react-router-dom')
    return {
        ...original,
        useLocation: jest.fn()
    }
})

jest.mock('react-intl', () => {
    return {
        useIntl: jest.fn().mockReturnValue({locale: 'en-GB'}),
        defineMessage: jest.fn((message) => message)
    }
})

beforeEach(() => {
    useSite.mockImplementation(() => ({
        id: 'site-id-2',
        alias: 'global',
        hostname: ['localhost']
    }))
    getSitesConfig.mockImplementation(() => [
        {
            id: 'site-id-1',
            alias: 'us',
            hostname: ['localhost']
        },
        {
            id: 'site-id-2',
            alias: 'global',
            hostname: ['localhost']
        }
    ])
    getDefaultSiteId.mockImplementation(() => 'site-id-2')
    jest.clearAllMocks()
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
    getUrlConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'path'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/global/women/dresses'
    }))
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/global/en-GB/page1')
})

test('append locale as path and site as query and calls history.push', () => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'query_param'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/global/women/dresses'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/women/dresses',
        search: '?site=global'
    }))
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/en-GB/page1?site=global')
})

test('works for any history method and args', () => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'path'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/global/women/dresses'
    }))
    const {getByTestId} = render(<TestComponent />)

    user.click(getByTestId('page2-link'))
    expect(mockHistoryReplace).toHaveBeenCalledWith('/global/en-GB/page2', {})
})

test('if given the path to root or homepage, will not prepend the locale', () => {
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page4-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/')
})
