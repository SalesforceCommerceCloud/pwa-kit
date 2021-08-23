/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import user from '@testing-library/user-event'
import useNavigation from './use-navigation'

const mockHistoryPush = jest.fn()
const mockHistoryReplace = jest.fn()

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

jest.mock('../locale', () => {
    return {useLocale: jest.fn().mockReturnValue(['en'])}
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
            <button data-testid="page3-link" onClick={() => navigate('/en/page3')} />
            <button data-testid="page4-link" onClick={() => navigate('/')} />
        </div>
    )
}

test('prepends locale and calls history.push', () => {
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page1-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/en/page1')
})

test('works for any history method and args', () => {
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page2-link'))
    expect(mockHistoryReplace).toHaveBeenCalledWith('/en/page2', {})
})

test('wont prepend locale if already given', () => {
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page3-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/en/page3')
})

test('if given the path to root or homepage, will not prepend the locale', () => {
    const {getByTestId} = render(<TestComponent />)
    user.click(getByTestId('page4-link'))
    expect(mockHistoryPush).toHaveBeenCalledWith('/')
})
