/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {useSubscription} from './use-subscription'
import {CONSENT_TAGS, CONSENT_CHANNELS, CONSENT_STATUS} from '../../constants/marketing-consent'
import {IntlProvider} from 'react-intl'

jest.mock('../../hooks', () => ({
    useMarketingConsent: jest.fn()
}))

async function runStandardTest(wrapper) {
    const {result} = renderHook(() => useSubscription(), {wrapper})

    act(() => {
        result.current.actions.setEmail('user@example.com')
    })
    await submitButton(result)

    return result
}

function expectError(result, expected_message) {
    expect(result.current.state.feedback?.type).toBe('error')
    expect(result.current.state.feedback?.message).toBe(expected_message)
}

const ERROR_INVALID_EMAIL = 'Enter a valid email address.'
const ERROR_GENERIC_MESSAGE = "We couldn't process the subscription. Try again."

async function submitButton(result) {
    await act(async () => {
        await result.current.actions.submit()
    })
}

describe('useSubscription', () => {
    const mockFetch = jest.fn()
    const mockSubmit = jest.fn()

    const setHookReturn = (overrides = {}) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {useMarketingConsent} = require('../../hooks')
        useMarketingConsent.mockReturnValue({
            fetchConsentItems: mockFetch,
            submitConsent: mockSubmit,
            isLoading: false,
            ...overrides
        })
    }

    beforeEach(() => {
        jest.clearAllMocks()
        setHookReturn()
    })

    const wrapper = ({children}) => (
        <IntlProvider locale="en-GB" defaultLocale="en-GB">
            {children}
        </IntlProvider>
    )

    test('initial state', () => {
        const {result} = renderHook(() => useSubscription(), {wrapper})

        expect(result.current.state.email).toBe('')
        expect(result.current.state.isLoading).toBe(false)
        expect(result.current.state.feedback).toEqual({message: null, type: 'success'})
    })

    test('validation: empty email shows error', async () => {
        const {result} = renderHook(() => useSubscription(), {wrapper})
        await submitButton(result)

        expectError(result, ERROR_INVALID_EMAIL)
        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockSubmit).not.toHaveBeenCalled()
    })

    test('validation: invalid email shows error', async () => {
        const {result} = renderHook(() => useSubscription(), {wrapper})

        act(() => {
            result.current.actions.setEmail('invalid-email')
        })
        await submitButton(result)

        expectError(result, ERROR_INVALID_EMAIL)
        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockSubmit).not.toHaveBeenCalled()
    })

    test('no available subscriptions -> generic error', async () => {
        mockFetch.mockResolvedValue({data: [{subscriptionId: 'a', tags: ['OTHER_TAG']}]})

        const result = await runStandardTest(wrapper)

        expect(mockFetch).toHaveBeenCalledWith(CONSENT_TAGS.HOMEPAGE_BANNER)
        expect(mockSubmit).not.toHaveBeenCalled()
        expectError(result, ERROR_GENERIC_MESSAGE)
    })

    test('successful submission', async () => {
        mockFetch.mockResolvedValue({
            data: [{subscriptionId: 'weekly-newsletter', tags: [CONSENT_TAGS.HOMEPAGE_BANNER]}]
        })
        mockSubmit.mockResolvedValue({status: CONSENT_STATUS.OPT_IN})

        const result = await runStandardTest(wrapper)

        expect(mockFetch).toHaveBeenCalledWith(CONSENT_TAGS.HOMEPAGE_BANNER)
        expect(mockSubmit).toHaveBeenCalledWith({
            subscriptionId: 'weekly-newsletter',
            contactPointValue: 'user@example.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN
        })
        expect(result.current.state.feedback?.type).toBe('success')
        expect(result.current.state.feedback?.message).toBe('Thanks for subscribing!')
        expect(result.current.state.email).toBe('')
    })

    test('failed submission -> generic error', async () => {
        mockFetch.mockResolvedValue({
            data: [{subscriptionId: 'weekly-newsletter', tags: [CONSENT_TAGS.HOMEPAGE_BANNER]}]
        })
        mockSubmit.mockResolvedValue({status: CONSENT_STATUS.OPT_OUT})

        const result = await runStandardTest(wrapper)

        expectError(result, ERROR_GENERIC_MESSAGE)
    })

    test('fetchConsentItems throws -> generic error', async () => {
        mockFetch.mockRejectedValue(new Error('network'))

        const result = await runStandardTest(wrapper)
        expectError(result, ERROR_GENERIC_MESSAGE)
    })

    test('submitConsent throws -> generic error', async () => {
        mockFetch.mockResolvedValue({
            data: [{subscriptionId: 'weekly-newsletter', tags: [CONSENT_TAGS.HOMEPAGE_BANNER]}]
        })
        mockSubmit.mockRejectedValue(new Error('network'))
        const result = await runStandardTest(wrapper)

        expectError(result, ERROR_GENERIC_MESSAGE)
    })

    test('options wiring: custom pageTag and channel', async () => {
        mockFetch.mockResolvedValue({
            data: [{subscriptionId: 'custom-sub', tags: ['CUSTOM_TAG']}]
        })
        mockSubmit.mockResolvedValue({status: CONSENT_STATUS.OPT_IN})

        const {result} = renderHook(
            () => useSubscription({pageTag: 'CUSTOM_TAG', channel: CONSENT_CHANNELS.EMAIL}),
            {wrapper}
        )

        act(() => {
            result.current.actions.setEmail('user@example.com')
        })
        await submitButton(result)

        expect(mockFetch).toHaveBeenCalledWith('CUSTOM_TAG')
        expect(mockSubmit).toHaveBeenCalledWith({
            subscriptionId: 'custom-sub',
            contactPointValue: 'user@example.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN
        })
    })

    test('loading passthrough from useMarketingConsent', () => {
        setHookReturn({isLoading: true})
        const {result} = renderHook(() => useSubscription(), {wrapper})

        expect(result.current.state.isLoading).toBe(true)
    })
})
