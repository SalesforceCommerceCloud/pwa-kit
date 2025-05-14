/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {screen, waitFor, within} from '@testing-library/react'
import SearchInput from '@salesforce/retail-react-app/app/components/search/index'
import Suggestions from '@salesforce/retail-react-app/app/components/search/partials/suggestions'
import {
    clearSessionJSONItem,
    getSessionJSONItem,
    setSessionJSONItem,
    noop
} from '@salesforce/retail-react-app/app/utils/utils'
import {RECENT_SEARCH_KEY, RECENT_SEARCH_LIMIT} from '@salesforce/retail-react-app/app/constants'
import mockSearchResults from '@salesforce/retail-react-app/app/mocks/searchResults'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {rest} from 'msw'
import {mockCustomerBaskets} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const origin = jest.requireActual('@salesforce/pwa-kit-react-sdk/ssr/universal/utils')
    return {
        ...origin,
        getConfig: jest.fn()
    }
})

function getMockedConfigWithCommerceAgentSettings(mockConfig, enabled, askAgentOnSearch) {
    const commerceAgentSettings = JSON.parse(mockConfig.app.commerceAgent)
    const changedSettings = {
        ...commerceAgentSettings,
        enabled,
        askAgentOnSearch
    }
    return {
        ...mockConfig,
        app: {
            ...mockConfig.app,
            commerceAgent: JSON.stringify(changedSettings)
        }
    }
}

function setupUserEvent() {
    return userEvent.setup({
        advanceTimers: () => jest.runOnlyPendingTimers()
    })
}

beforeEach(() => {
    clearSessionJSONItem(RECENT_SEARCH_KEY)
    jest.resetModules()
    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockSearchResults))
        }),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        })
    )
    getConfig.mockImplementation(() => mockConfig)
    jest.useFakeTimers()
})

test('renders SearchInput', () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    expect(searchInput).toBeInTheDocument()
})

test('changes url when enter is pressed', async () => {
    const user = setupUserEvent()

    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dresses{enter}')
    await waitFor(() => {
        expect(window.location.pathname).toEqual(createPathWithDefaults('/search'))
        expect(window.location.search).toBe('?q=Dresses')
        const suggestionPopoverEl = screen.getByTestId('sf-suggestion-popover')
        expect(suggestionPopoverEl).toBeInTheDocument()
    })
})

test('shows previously searched items when focused', async () => {
    const user = setupUserEvent()

    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.clear(searchInput)
    await searchInput.focus()
    const suggestionPopoverEl = await screen.getByTestId('sf-suggestion-popover')
    const recentSearchesEl = await within(suggestionPopoverEl).getByTestId('sf-suggestion-recent')
    expect(recentSearchesEl).toBeInTheDocument()
    expect(
        document.querySelectorAll('[data-testid=sf-suggestion-popover] button[name=recent-search]')
    ).toHaveLength(3)
})

test('saves recent searches on submit', async () => {
    const user = setupUserEvent()
    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Gloves{enter}')
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toHaveLength(4)
})

test('limits number of saved recent searches', async () => {
    const user = setupUserEvent()

    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops', 'Gloves', 'Bracelets'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Ties{enter}')
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toHaveLength(RECENT_SEARCH_LIMIT)
})

test('suggestions render when there are some', async () => {
    jest.useRealTimers()
    const user = userEvent.setup()
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dress')

    expect(searchInput.value).toBe('Dress')
    const suggestionPopoverEl = await screen.getByTestId('sf-suggestion-popover')

    await waitFor(() => {
        const suggestionsEl = within(suggestionPopoverEl).getByTestId('sf-suggestion')
        expect(suggestionsEl.querySelector('button').textContent).toBe('Dresses')
    })
})

test('clicking clear searches clears recent searches', async () => {
    const user = setupUserEvent()
    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await searchInput.focus()
    const clearSearch = document.getElementById('clear-search')
    await user.click(clearSearch)
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toBeUndefined()
})

test('passing undefined to Suggestions returns undefined', async () => {
    const suggestions = renderWithProviders(
        <Suggestions suggestions={undefined} closeAndNavigate={noop} />
    )
    expect(suggestions.innerHTML).toBeUndefined()
})

test('when commerceAgent is disabled, chat functions are not called', async () => {
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'false', 'true')
    )

    // Create spies for chat functions
    const sendTextMessageSpy = jest.fn()
    const launchChatSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
    }

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search
    await user.type(searchInput, 'test search{enter}')

    // Verify chat functions were not called
    expect(sendTextMessageSpy).not.toHaveBeenCalled()
    expect(launchChatSpy).not.toHaveBeenCalled()
})

test('when askAgentOnSearch is disabled, chat functions are not called', async () => {
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'false', 'true')
    )

    // Create spies for chat functions
    const sendTextMessageSpy = jest.fn()
    const launchChatSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
    }

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search
    await user.type(searchInput, 'test search{enter}')

    // Verify chat functions were not called
    expect(sendTextMessageSpy).not.toHaveBeenCalled()
    expect(launchChatSpy).not.toHaveBeenCalled()
})

test('when askAgentOnSearch is enabled and sendTextMessage succeeds, launchChat is not called', async () => {
    jest.useFakeTimers()
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'true', 'true')
    )

    // Create spies for chat functions
    const sendTextMessageSpy = jest.fn().mockResolvedValue('success')
    const launchChatSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
    }

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify sendTextMessage was called but launchChat was not
    expect(sendTextMessageSpy).toHaveBeenCalledWith('test search')
    expect(launchChatSpy).not.toHaveBeenCalled()
})

test('when sendTextMessage fails and launchChat succeeds, sends message after bot response', async () => {
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'true', 'true')
    )

    // Create spies for chat functions
    const sendTextMessageSpy = jest
        .fn()
        .mockRejectedValueOnce(
            'invoke API before the onEmbeddedMessagingConversationOpened event is fired'
        )
        .mockResolvedValue('success')
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')

    // Mock window.embeddedservice_bootstrap
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
    }

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify first sendTextMessage failed and triggered launchChat
    expect(sendTextMessageSpy).toHaveBeenCalledWith('test search')
    expect(launchChatSpy).toHaveBeenCalled()

    // Simulate bot response
    window.dispatchEvent(
        new CustomEvent('onEmbeddedMessageSent', {
            detail: {
                conversationEntry: {
                    sender: {
                        role: 'Chatbot'
                    }
                }
            }
        })
    )

    // Wait for the setTimeout after bot message
    jest.advanceTimersByTime(500)

    // Verify second sendTextMessage was called
    expect(sendTextMessageSpy).toHaveBeenCalledTimes(2)
    expect(sendTextMessageSpy).toHaveBeenLastCalledWith('test search')

    // Simulate bot response again
    window.dispatchEvent(
        new CustomEvent('onEmbeddedMessageSent', {
            detail: {
                conversationEntry: {
                    sender: {
                        role: 'Chatbot'
                    }
                }
            }
        })
    )

    // Wait for the setTimeout after bot message
    jest.advanceTimersByTime(500)

    // Verify sendTextMessage was not called again
    expect(sendTextMessageSpy).toHaveBeenCalledTimes(2)
})

test('when sendTextMessage fails and launchChat returns maximized message, no additional send text is triggered', async () => {
    jest.useFakeTimers()
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'true', 'true')
    )

    // Create spies for chat functions
    const sendTextMessageSpy = jest
        .fn()
        .mockRejectedValue(
            'invoke API before the onEmbeddedMessagingConversationOpened event is fired'
        )
    const launchChatSpy = jest.fn().mockResolvedValue('Successfully maximized the messaging client')

    // Mock window.embeddedservice_bootstrap
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
    }

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify sendTextMessage was called and failed
    expect(sendTextMessageSpy).toHaveBeenCalledWith('test search')
    expect(launchChatSpy).toHaveBeenCalled()

    // Wait for any potential setTimeout after launchChat
    jest.advanceTimersByTime(500)

    // Verify sendTextMessage was only called once
    expect(sendTextMessageSpy).toHaveBeenCalledTimes(1)
})

test('when sendTextMessage and launchChat both fail, no additional send text is triggered', async () => {
    jest.useFakeTimers()
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'true', 'true')
    )

    // Create spies for chat functions
    const sendTextMessageSpy = jest
        .fn()
        .mockRejectedValue(
            'invoke API before the onEmbeddedMessagingConversationOpened event is fired'
        )
    const launchChatSpy = jest.fn().mockRejectedValue('Failed to launch chat')

    // Mock window.embeddedservice_bootstrap
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
    }

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify sendTextMessage was called and failed
    expect(sendTextMessageSpy).toHaveBeenCalledWith('test search')
    expect(launchChatSpy).toHaveBeenCalled()

    // Wait for any potential setTimeout after launchChat
    jest.advanceTimersByTime(500)

    // Verify sendTextMessage was only called once
    expect(sendTextMessageSpy).toHaveBeenCalledTimes(1)
})
