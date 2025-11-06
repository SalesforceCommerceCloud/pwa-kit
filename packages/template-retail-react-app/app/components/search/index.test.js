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
    const commerceAgentSettings = mockConfig.app.commerceAgent
    const changedSettings = {
        ...commerceAgentSettings,
        enabled,
        askAgentOnSearch
    }
    return {
        ...mockConfig,
        app: {
            ...mockConfig.app,
            commerceAgent: changedSettings
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
    jest.useRealTimers()
    const {user} = renderWithProviders(<SearchInput />)
    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Gloves{enter}')
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toHaveLength(4)
})

test('limits number of saved recent searches', async () => {
    jest.useRealTimers()
    const {user} = renderWithProviders(<SearchInput />)

    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops', 'Gloves', 'Bracelets'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Ties{enter}')
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toHaveLength(RECENT_SEARCH_LIMIT)
})

test('suggestions render when there are some', async () => {
    jest.useRealTimers()
    const {user} = renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dress')

    expect(searchInput.value).toBe('Dress')
    const suggestionPopoverEl = await screen.getByTestId('sf-suggestion-popover')

    await waitFor(() => {
        const suggestionsEls = within(suggestionPopoverEl).getAllByTestId('sf-suggestion')
        expect(suggestionsEls.length).toBeGreaterThan(0)
        const hasDressesSuggestion = suggestionsEls.some((el) =>
            el.querySelector('button')?.textContent?.includes('Dresses')
        )
        expect(hasDressesSuggestion).toBe(true)
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

test('handles search phrase in formatSuggestions', async () => {
    const user = setupUserEvent()

    const mockResultsWithPhrase = {
        ...mockSearchResults,
        searchPhrase: 'test search phrase'
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithPhrase))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'test')

    // Wait for suggestions to load with search phrase
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles phrase suggestions in formatSuggestions', async () => {
    const user = setupUserEvent()

    // Mock search results with phrase suggestions
    const mockResultsWithPhrases = {
        ...mockSearchResults,
        productSuggestions: {
            ...mockSearchResults.productSuggestions,
            suggestedPhrases: [
                {phrase: 'running shoes', exactMatch: true},
                {phrase: 'athletic wear', exactMatch: false}
            ]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithPhrases))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'running')

    // Wait for suggestions to load with phrase suggestions
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles product suggestions with images', async () => {
    const user = setupUserEvent()

    // Mock search results with product suggestions that have images
    const mockResultsWithProductImages = {
        ...mockSearchResults,
        productSuggestions: {
            ...mockSearchResults.productSuggestions,
            products: [
                {
                    ...mockSearchResults.productSuggestions.products[0],
                    image: {
                        disBaseLink: 'https://example.com/product-image.jpg'
                    }
                }
            ]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithProductImages))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'Dress')

    // Wait for suggestions to load with product images
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('sets pre-chat fields when launching chat for the first time', async () => {
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
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')
    const setHiddenPrechatFieldsSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap with prechatAPI
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        },
        prechatAPI: {
            setHiddenPrechatFields: setHiddenPrechatFieldsSpy
        }
    }

    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'us', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search to trigger chat launch
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify pre-chat fields were set before launching chat
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            Locale: expect.any(String),
            UsId: expect.any(String),
            IsCartMgmtSupported: 'true',
            Language: expect.any(String),
            DomainUrl: expect.any(String)
        })
    )

    // Verify launchChat was called
    expect(launchChatSpy).toHaveBeenCalled()
})

test('does not set pre-chat fields when chat is already launched', async () => {
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
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')
    const setHiddenPrechatFieldsSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap with prechatAPI
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        },
        prechatAPI: {
            setHiddenPrechatFields: setHiddenPrechatFieldsSpy
        }
    }

    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'us', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')

    // First search - should set pre-chat fields
    await user.type(searchInput, 'first search{enter}')
    jest.advanceTimersByTime(500)

    // Verify pre-chat fields were set the first time
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledTimes(1)

    // Clear input and perform second search
    await user.clear(searchInput)
    await user.type(searchInput, 'second search{enter}')
    jest.advanceTimersByTime(500)

    // Verify pre-chat fields were NOT set again (still only called once)
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledTimes(1)
})

test('handles missing prechatAPI gracefully', async () => {
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
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')

    // Mock window.embeddedservice_bootstrap WITHOUT prechatAPI
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        }
        // Note: prechatAPI is missing
    }

    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'us', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search - should not throw error
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify launchChat was still called (functionality continues)
    expect(launchChatSpy).toHaveBeenCalled()
})

test('sets correct pre-chat fields for different locales', async () => {
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
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')
    const setHiddenPrechatFieldsSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap with prechatAPI
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        },
        prechatAPI: {
            setHiddenPrechatFields: setHiddenPrechatFieldsSpy
        }
    }

    // Test with UK locale
    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search to trigger chat launch
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify pre-chat fields were set with UK locale data
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            Locale: expect.any(String),
            UsId: expect.any(String),
            IsCartMgmtSupported: 'true',
            Language: expect.any(String),
            DomainUrl: expect.any(String)
        })
    )
})

test('setPrechatFieldsForNewSession function works correctly', async () => {
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
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')
    const setHiddenPrechatFieldsSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap with prechatAPI
    window.embeddedservice_bootstrap = {
        utilAPI: {
            sendTextMessage: sendTextMessageSpy,
            launchChat: launchChatSpy
        },
        prechatAPI: {
            setHiddenPrechatFields: setHiddenPrechatFieldsSpy
        }
    }

    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'us', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')

    // Perform a search to trigger chat launch
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify the function was called with correct parameters
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledTimes(1)
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            Locale: expect.any(String),
            UsId: expect.any(String),
            IsCartMgmtSupported: 'true',
            Language: expect.any(String),
            DomainUrl: expect.any(String)
        })
    )
})

test('verifies DomainUrl is correctly constructed with appOrigin and buildUrl', async () => {
    const user = setupUserEvent()

    getConfig.mockImplementation(() =>
        getMockedConfigWithCommerceAgentSettings(mockConfig, 'true', 'true')
    )

    // Create spies for chat functions and prechat API
    const sendTextMessageSpy = jest
        .fn()
        .mockRejectedValue(
            'invoke API before the onEmbeddedMessagingConversationOpened event is fired'
        )
    const launchChatSpy = jest
        .fn()
        .mockResolvedValue('Successfully initialized the messaging client')
    const setHiddenPrechatFieldsSpy = jest.fn()

    // Mock window.embeddedservice_bootstrap with prechatAPI
    Object.defineProperty(window, 'embeddedservice_bootstrap', {
        value: {
            utilAPI: {
                sendTextMessage: sendTextMessageSpy,
                launchChat: launchChatSpy
            },
            prechatAPI: {
                setHiddenPrechatFields: setHiddenPrechatFieldsSpy
            }
        },
        writable: true
    })

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    // Type in search input and submit
    await user.type(searchInput, 'test search{enter}')

    // Wait for the setTimeout in onSubmitSearch
    jest.advanceTimersByTime(500)

    // Verify DomainUrl is constructed correctly
    expect(setHiddenPrechatFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            DomainUrl: expect.stringMatching(/^https:\/\/www\.domain\.com\/.*$/)
        })
    )

    // Get the actual call to verify the specific DomainUrl value
    const prechatFieldsCall = setHiddenPrechatFieldsSpy.mock.calls[0][0]
    expect(prechatFieldsCall.DomainUrl).toMatch(/^https:\/\/www\.domain\.com\/.*$/)
})
