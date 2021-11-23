/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState, useEffect} from 'react'
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
} from '@chakra-ui/react'
import SearchSuggestions from './partials/search-suggestions'
import {SearchIcon} from '../icons'
import useSearchSuggestions from '../../commerce-api/hooks/useSearchSuggestions'
import {capitalize, boldString, getSessionJSONItem, setSessionJSONItem} from '../../utils/utils'
import useNavigation from '../../hooks/use-navigation'
import {HideOnDesktop, HideOnMobile} from '../responsive'
import {FormattedMessage} from 'react-intl'
import debounce from 'lodash.debounce'
import {RECENT_SEARCH_KEY, RECENT_SEARCH_LIMIT, RECENT_SEARCH_MIN_LENGTH} from '../../constants'
import {productUrlBuilder, searchUrlBuilder, categoryUrlBuilder} from '../../utils/url'

const formatSuggestions = (searchSuggestions, input) => {
    return {
        categorySuggestions: searchSuggestions?.categorySuggestions?.categories?.map(
            (suggestion) => {
                return {
                    type: 'category',
                    id: suggestion.id,
                    link: categoryUrlBuilder({id: suggestion.id}),
                    name: boldString(suggestion.name, capitalize(input))
                }
            }
        ),
        productSuggestions: searchSuggestions?.productSuggestions?.products?.map((product) => {
            return {
                type: 'product',
                currency: product.currency,
                price: product.price,
                productId: product.productId,
                name: boldString(product.productName, capitalize(input)),
                link: productUrlBuilder({id: product.productId})
            }
        }),
        phraseSuggestions: searchSuggestions?.categorySuggestions?.suggestedPhrases?.map(
            (phrase) => {
                return {
                    type: 'phrase',
                    name: boldString(phrase.phrase, capitalize(input)),
                    link: searchUrlBuilder(phrase.phrase)
                }
            }
        )
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
    const navigate = useNavigation()
    const searchSuggestion = useSearchSuggestions()
    const searchInputRef = useRef()
    const [isOpen, setIsOpen] = useState(false)
    const recentSearches = getSessionJSONItem(RECENT_SEARCH_KEY)
    const searchSuggestions = formatSuggestions(
        searchSuggestion.results,
        searchInputRef?.current?.value
    )

    // check if popover should open if we have suggestions
    useEffect(() => {
        shouldOpenPopover()
    }, [searchSuggestions])

    // Want to make sure we clear the suggestions when we are deleting characters
    useEffect(() => {
        if (searchInputRef?.current?.value <= 2) {
            searchSuggestion.clearSuggestedSearch()
        }
    }, [searchInputRef?.current?.value])

    const searchSuggestionsAvailable =
        searchSuggestions &&
        (searchSuggestions?.categorySuggestions?.length ||
            searchSuggestions?.phraseSuggestions?.length)

    const saveRecentSearch = (searchText) => {
        // Get recent searches or an empty array if undefined.
        let searches = getSessionJSONItem(RECENT_SEARCH_KEY) || []

        // Check if term is already in the saved searches
        searches = searches.filter((savedSearchTerm) => {
            searchText.toLowerCase() !== savedSearchTerm.toLowerCase()
        })

        // Create a new array consisting of the search text and up to 4 other resent searches.
        // I'm assuming the order is newest to oldest.
        searches = [searchText, ...searches].slice(0, RECENT_SEARCH_LIMIT)

        // Replace the save resent search with the updated value.
        setSessionJSONItem(RECENT_SEARCH_KEY, searches)
    }

    const debouncedSearch = debounce((input) => searchSuggestion.getSearchSuggestions(input), 300)

    const onSearchChange = async (e) => {
        const input = e.target.value
        if (input.length >= RECENT_SEARCH_MIN_LENGTH) {
            debouncedSearch(input)
        }
    }

    const clearInput = () => {
        searchInputRef.current.blur()
        searchSuggestion.clearSuggestedSearch()
        setIsOpen(false)
    }

    const onSubmitSearch = (e) => {
        e.preventDefault()
        // Avoid blank spaces to be searched
        let searchText = searchInputRef.current.value.trim()
        // Avoid empty string searches
        if (searchText.length < 1) {
            return
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
            (searchSuggestionsAvailable && searchInputRef.current.value.length > 0)
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
                <PopoverTrigger>
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
                    <PopoverContent data-testid="sf-suggestion-popover">
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
