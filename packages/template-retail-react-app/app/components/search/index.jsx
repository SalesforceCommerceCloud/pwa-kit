/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {useSearchSuggestions} from '@salesforce/commerce-sdk-react'
import {
    Input,
    InputGroup,
    InputLeftElement,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    Box,
    Flex,
    HStack,
    Spinner
} from '@salesforce/retail-react-app/app/components/shared/ui'
import SearchSuggestions from '@salesforce/retail-react-app/app/components/search/partials/search-suggestions'
import {SearchIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    capitalize,
    getSessionJSONItem,
    setSessionJSONItem
} from '@salesforce/retail-react-app/app/utils/utils'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import {FormattedMessage} from 'react-intl'
import debounce from 'lodash/debounce'
import {
    RECENT_SEARCH_KEY,
    RECENT_SEARCH_LIMIT,
    RECENT_SEARCH_MIN_LENGTH
} from '@salesforce/retail-react-app/app/constants'
import {
    productUrlBuilder,
    searchUrlBuilder,
    categoryUrlBuilder
} from '@salesforce/retail-react-app/app/utils/url'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getCommerceAgentConfig} from '@salesforce/retail-react-app/app/utils/config-utils'
import {useUsid} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {normalizeLocaleToSalesforce} from '@salesforce/retail-react-app/app/hooks/use-miaw'

const onClient = typeof window !== 'undefined'

function isAskAgentOnSearchEnabled(enabled, askAgentOnSearch) {
    return enabled === 'true' && askAgentOnSearch === 'true' && onClient
}

const formatSuggestions = (searchSuggestions) => {
    return {
        categorySuggestions: searchSuggestions?.categorySuggestions?.categories?.map(
            (suggestion) => {
                return {
                    type: 'category',
                    id: suggestion.id,
                    link: categoryUrlBuilder({id: suggestion.id}),
                    name: capitalize(suggestion.name),
                    image: suggestion.image?.disBaseLink,
                    parentCategoryName: suggestion.parentCategoryName
                }
            }
        ),
        productSuggestions: searchSuggestions?.productSuggestions?.products?.map((product) => {
            return {
                type: 'product',
                currency: product.currency,
                price: product.price,
                productId: product.productId,
                name: capitalize(product.productName),
                link: productUrlBuilder({id: product.productId}),
                image: product.image?.disBaseLink
            }
        }),
        brandSuggestions: searchSuggestions?.brandSuggestions?.suggestedPhrases?.map((brand) => {
            // Init cap the brand name
            return {
                type: 'brand',
                name: capitalize(brand.phrase),
                link: searchUrlBuilder(brand.phrase)
            }
        }),
        phraseSuggestions: searchSuggestions?.productSuggestions?.suggestedPhrases?.map(
            (phrase) => {
                return {
                    type: 'phrase',
                    name: phrase.phrase,
                    link: searchUrlBuilder(phrase.phrase),
                    exactMatch: phrase.exactMatch
                }
            }
        ),
        // Einstein suggestions for popular and recent searches
        popularSearchSuggestions:
            searchSuggestions?.einsteinSuggestedPhrases?.popularSearchPhrases?.map((phrase) => {
                return {
                    type: 'popular',
                    name: phrase.phrase,
                    link: searchUrlBuilder(phrase.phrase),
                    exactMatch: phrase.exactMatch
                }
            }),
        recentSearchSuggestions:
            searchSuggestions?.einsteinSuggestedPhrases?.recentSearchPhrases?.map((phrase) => {
                return {
                    type: 'recent',
                    name: phrase.phrase,
                    link: searchUrlBuilder(phrase.phrase),
                    exactMatch: phrase.exactMatch
                }
            }),
        searchPhrase: searchSuggestions?.searchPhrase
    }
}

/**
 * The SearchInput component is a stylized
 * text input made specifically for use in
 * the application header.
 * @param  {object} props
 * @param  {object} ref reference to the input element
 * @return  {React.ReactElement} - SearchInput component
 */
const Search = (props) => {
    const config = getConfig()

    // Add new hooks for chat functionality
    const {locale, siteId, commerceOrgId, buildUrl} = useMultiSite()
    const {usid} = useUsid()
    const refreshToken = useRefreshToken()
    const location = useLocation()
    const appOrigin = useAppOrigin()
    const sfLanguage = normalizeLocaleToSalesforce(locale.id)

    const askAgentOnSearchEnabled = useMemo(() => {
        const {enabled, askAgentOnSearch} = getCommerceAgentConfig()
        return isAskAgentOnSearchEnabled(enabled, askAgentOnSearch)
    }, [config.app.commerceAgent])

    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigation()

    const searchSuggestion = useSearchSuggestions(
        {
            parameters: {
                q: searchQuery,
                expand: 'images,prices',
                includeEinsteinSuggestedPhrases: true
            }
        },
        {
            enabled: searchQuery?.length >= RECENT_SEARCH_MIN_LENGTH
        }
    )
    const searchInputRef = useRef()
    const miawChatRef = useRef({
        newChatLaunched: false,
        hasFired: false
    })
    const recentSearches = getSessionJSONItem(RECENT_SEARCH_KEY)
    const searchSuggestions = useMemo(
        () => formatSuggestions(searchSuggestion.data),
        [searchSuggestion]
    )

    // check if popover should open if we have suggestions
    useEffect(() => {
        shouldOpenPopover()
    }, [searchQuery, searchSuggestion.data])

    const searchSuggestionsAvailable =
        searchSuggestions &&
        (searchSuggestions?.categorySuggestions?.length ||
            searchSuggestions?.phraseSuggestions?.length ||
            searchSuggestions?.popularSearchSuggestions?.length ||
            searchSuggestions?.recentSearchSuggestions?.length)

    const saveRecentSearch = (searchText) => {
        // Get recent searches or an empty array if undefined.
        let searches = getSessionJSONItem(RECENT_SEARCH_KEY) || []

        // Check if term is already in the saved searches
        searches = searches.filter((savedSearchTerm) => {
            return searchText.toLowerCase() !== savedSearchTerm.toLowerCase()
        })

        // Create a new array consisting of the search text and up to 4 other resent searches.
        // I'm assuming the order is newest to oldest.
        searches = [searchText, ...searches].slice(0, RECENT_SEARCH_LIMIT)

        // Replace the save resent search with the updated value.
        setSessionJSONItem(RECENT_SEARCH_KEY, searches)
    }

    const debouncedSearch = debounce((input) => {
        debouncedSearch.cancel()
        setSearchQuery(input)
    }, 300)

    const onSearchChange = async (e) => {
        const input = e.target.value
        if (input.length >= RECENT_SEARCH_MIN_LENGTH) {
            debouncedSearch(input)
        } else {
            setSearchQuery('')
        }
    }

    const clearInput = () => {
        searchInputRef.current.blur()
        setIsOpen(false)
    }

    // Function to set pre-chat fields only when launching a new chat session
    const setPrechatFieldsForNewSession = () => {
        // Only set pre-chat fields if this is a new chat launch (not already launched)
        if (!miawChatRef.current.newChatLaunched) {
            if (window.embeddedservice_bootstrap?.prechatAPI) {
                window.embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
                    SiteId: siteId,
                    Locale: locale.id,
                    OrganizationId: commerceOrgId,
                    UsId: usid,
                    IsCartMgmtSupported: 'true',
                    RefreshToken: refreshToken,
                    Currency: locale.preferredCurrency,
                    Language: sfLanguage,
                    DomainUrl: `${appOrigin}${buildUrl(location.pathname)}`
                })
            }
        }
    }

    useEffect(() => {
        const handleEmbeddedMessageSent = (e) => {
            if (!miawChatRef.current.hasFired && miawChatRef.current.newChatLaunched) {
                if (
                    e.detail.conversationEntry?.sender?.role === 'Chatbot' &&
                    searchInputRef?.current?.value &&
                    window.embeddedservice_bootstrap?.utilAPI
                ) {
                    miawChatRef.current.hasFired = true
                    setTimeout(() => {
                        window.embeddedservice_bootstrap.utilAPI.sendTextMessage(
                            searchInputRef.current.value.trim()
                        )
                    }, 500)
                }
            }
        }

        window.addEventListener('onEmbeddedMessageSent', handleEmbeddedMessageSent)

        return () => {
            // Clean up
            window.removeEventListener('onEmbeddedMessageSent', handleEmbeddedMessageSent)
        }
    }, [])
    const launchChat = () => {
        // Set pre-chat fields only for new sessions
        setPrechatFieldsForNewSession()

        if (window.embeddedservice_bootstrap?.settings) {
            window.embeddedservice_bootstrap.settings.disableStreamingResponses = true
            window.embeddedservice_bootstrap.settings.enableUserInputForConversationWithBot = false
        }
        window.embeddedservice_bootstrap?.utilAPI
            ?.launchChat()
            ?.then((successMessage) => {
                /* TODO: With the Salesforce Winter '26 release, we will be able to use the
                 * onEmbeddedMessagingFirstBotMessageSent event instead, and get rid of this logic. */
                if (successMessage.includes('Successfully initialized the messaging client')) {
                    miawChatRef.current.hasFired = false //We want the logic in onEmbeddedMessageSent to happen once per new conversation
                    miawChatRef.current.newChatLaunched = true
                }
            })
            ?.catch((err) => {
                console.error('launchChat error', err)
            })
    }

    const onSubmitSearch = (e) => {
        e.preventDefault()
        // Avoid blank spaces to be searched
        let searchText = searchInputRef.current.value.trim()
        // Avoid empty string searches
        if (searchText.length < 1) {
            return
        }

        if (askAgentOnSearchEnabled && window.embeddedservice_bootstrap?.utilAPI) {
            // Add a 500ms delay before sending the message to ensure the experience isn't jarring to the user
            setTimeout(() => {
                window.embeddedservice_bootstrap.utilAPI
                    .sendTextMessage(searchText)
                    .catch((err) => {
                        console.error(err)
                        if (
                            err.includes(
                                'invoke API before the onEmbeddedMessagingConversationOpened event is fired'
                            )
                        ) {
                            launchChat()
                        }
                    })
            }, 500)
        }

        saveRecentSearch(searchText)
        clearInput()
        navigate(searchUrlBuilder(searchText))
    }

    const closeAndNavigate = (link) => {
        if (!link) {
            clearInput()
            setIsOpen(false)
        } else {
            clearInput()
            setIsOpen(false)
            navigate(link)
        }
    }

    const shouldOpenPopover = () => {
        // As per design we only want to show the popover if the input is focused and we have recent searches saved
        // or we have search suggestions available and have inputed some text (empty text in this scenario should show recent searches)
        if (
            (document.activeElement.id === 'search-input' && recentSearches?.length > 0) ||
            (searchSuggestionsAvailable && searchInputRef.current?.value?.length > 0)
        ) {
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }

    const onSearchInputChange = (e) => {
        onSearchChange(e)
        shouldOpenPopover()
    }

    return (
        <Box>
            <Popover isOpen={isOpen} isLazy initialFocusRef={searchInputRef}>
                <PopoverTrigger asChild>
                    <form onSubmit={onSubmitSearch}>
                        <HStack>
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <SearchIcon />
                                </InputLeftElement>
                                <Input
                                    autoComplete="off"
                                    id="search-input"
                                    onChange={(e) => onSearchInputChange(e)}
                                    onFocus={() => shouldOpenPopover()}
                                    onBlur={() => setIsOpen(false)}
                                    type="search"
                                    ref={searchInputRef}
                                    {...props}
                                    variant="filled"
                                />
                            </InputGroup>
                            <HideOnDesktop>
                                <Button
                                    display={isOpen ? 'block' : 'none'}
                                    variant="link"
                                    size="sm"
                                    onMouseDown={() => closeAndNavigate(false)}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        id="search.action.cancel"
                                    />
                                </Button>
                            </HideOnDesktop>
                        </HStack>
                    </form>
                </PopoverTrigger>

                <HideOnMobile>
                    <PopoverContent
                        data-testid="sf-suggestion-popover"
                        width="100vw"
                        maxWidth="100vw"
                        left={0}
                        right={0}
                        marginLeft={0}
                        marginRight={0}
                    >
                        <SearchSuggestions
                            closeAndNavigate={closeAndNavigate}
                            recentSearches={recentSearches}
                            searchSuggestions={searchSuggestions}
                        />
                    </PopoverContent>
                </HideOnMobile>
            </Popover>
            <HideOnDesktop>
                <Flex
                    display={isOpen || searchInputRef?.value?.length > 0 ? 'block' : 'none'}
                    postion="absolute"
                    background="white"
                    left={0}
                    right={0}
                    height="100vh"
                >
                    {searchSuggestion.isLoading ? (
                        <Spinner
                            position="absolute"
                            top="50%"
                            left="50%"
                            opacity={0.85}
                            color="blue.600"
                            zIndex="9999"
                            margin="-25px 0 0 -25px"
                        />
                    ) : (
                        <SearchSuggestions
                            closeAndNavigate={closeAndNavigate}
                            recentSearches={recentSearches}
                            searchSuggestions={searchSuggestions}
                        />
                    )}
                </Flex>
            </HideOnDesktop>
        </Box>
    )
}

Search.displayName = 'SearchInput'

export default Search
