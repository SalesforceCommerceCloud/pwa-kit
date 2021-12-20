/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import user from '@testing-library/user-event'
import useNavigation from './use-navigation'
import {getConfig} from '../utils/utils'

import {useLocation} from 'react-router-dom'
import {render} from '@testing-library/react'

const mockHistoryPush = jest.fn()
const mockHistoryReplace = jest.fn()

jest.mock('../utils/utils', () => {
    const original = jest.requireActual('../utils/utils')
    return {
        ...original,
        getConfig: jest.fn()
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
    getConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'path'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/global/women/dresses'
    }))
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/site-alias-2/en-GB/page1')
})

test('append locale as path and site as query and calls history.push', () => {
    getConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'query_param'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/global/women/dresses'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/women/dresses',
        search: '?site=site-alias-2'
    }))
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/en-GB/page1?site=site-alias-2')
})

test('works for any history method and args', () => {
    getConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'path'
    }))
    useLocation.mockImplementation(() => ({
        pathname: '/en-GB/site-alias-2/women/dresses'
    }))
    const {getByTestId} = render(<TestComponent />)

    user.click(getByTestId('page2-link'))
    expect(mockHistoryReplace).toHaveBeenCalledWith('/site-alias-2/en-GB/page2', {})
})

test('if given the path to root or homepage, will not prepend the locale', () => {
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page4-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/')
})
