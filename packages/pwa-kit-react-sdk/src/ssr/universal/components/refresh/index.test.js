/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQueryClient} from '@tanstack/react-query'
import {mount} from 'enzyme'
import React from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import Refresh from './index'

jest.useFakeTimers()

const referrerURL = 'some-url'
jest.mock('react-router-dom', () => {
    const replace = jest.fn()
    return {
        useHistory: jest.fn(() => ({
            replace
        })),
        useLocation: jest.fn(() => ({
            search: `?referrer=${referrerURL}`
        }))
    }
})

jest.mock('@tanstack/react-query', () => {
    const invalidateQueries = jest.fn()
    return {
        useQueryClient: jest.fn(() => ({
            invalidateQueries
        }))
    }
})

// Similar to `waitFor` in testing-library/react
// See: https://www.benmvp.com/blog/asynchronous-testing-with-enzyme-react-jest/
const runAllPromises = () => new Promise((resolve) => setImmediate(resolve))

test('renders a loading spinner initially', () => {
    const wrapper = mount(<Refresh />)
    expect(wrapper.find('[data-testid="loading-spinner"]').length).toBe(1)
})

test('wait for react-query cache to be invalidated', async () => {
    mount(<Refresh />)
    await runAllPromises()
    expect(useQueryClient().invalidateQueries).toHaveBeenCalled()
})

test('a project not using react-query', async () => {
    // If customer project does not use react-query, calling useQueryClient would throw an error
    useQueryClient.mockImplementationOnce(() => {
        throw new Error()
    })
    mount(<Refresh />)
    jest.runAllTimers()
    await runAllPromises()

    // Expect to still continue despite the project not using react-query,
    // specifically continue to navigate back to the referrer.
    expect(useHistory().replace).toHaveBeenCalledWith(referrerURL)
})

test('wait for soft navigation to the referrer', async () => {
    mount(<Refresh />)
    jest.runAllTimers()
    await runAllPromises()

    expect(useHistory().replace).toHaveBeenCalledWith(referrerURL)
})

test('navigate to homepage if `referrer` search param cannot be found in the page url', async () => {
    jest.spyOn(console, 'warn')

    useLocation.mockImplementationOnce(() => ({
        search: ''
    }))
    mount(<Refresh />)
    jest.runAllTimers()
    await runAllPromises()

    expect(console.warn).toHaveBeenCalled()
    expect(useHistory().replace).toHaveBeenCalledWith('/')
})
