/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useRef, useCallback, useEffect} from 'react'
import {useMapsLibrary} from '@vis.gl/react-google-maps'
import {convertGoogleMapsSuggestions} from '@salesforce/retail-react-app/app/utils/address-suggestions'

const DEBOUNCE_DELAY = 300

/**
 * Custom hook for Google Maps Places autocomplete suggestions
 * @param {string} inputString - The input string to search for
 * @param {string} countryCode - Country code to filter results (e.g., 'US', 'CA')
 * @param {Object} requestOptions - Additional request options for the API
 * @returns {Object} Object containing suggestions, loading state, and reset function
 */
export const useAutocompleteSuggestions = (
    inputString = '',
    countryCode = '',
    requestOptions = {}
) => {
    const places = useMapsLibrary('places')

    const sessionTokenRef = useRef(null)
    const debounceTimeoutRef = useRef(null)

    const cacheRef = useRef(new Map())

    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // Key format: `${inputString.toLowerCase().trim()}_${countryCode}`
    const getCacheKey = useCallback((input, country) => {
        return `${input.toLowerCase().trim()}_${country || ''}`
    }, [])

    const fetchSuggestions = useCallback(
        async (input) => {
            if (!places || !input || input.length < 3) {
                setSuggestions([])
                return
            }

            const cacheKey = getCacheKey(input, countryCode)

            // Check cache first
            if (cacheRef.current.has(cacheKey)) {
                const cachedSuggestions = cacheRef.current.get(cacheKey)
                setSuggestions(cachedSuggestions)
                setIsLoading(false)
                return
            }

            setIsLoading(true)

            try {
                const {AutocompleteSessionToken, AutocompleteSuggestion} = places

                if (!sessionTokenRef.current) {
                    sessionTokenRef.current = new AutocompleteSessionToken()
                }

                const request = {
                    ...requestOptions,
                    input: input,
                    includedPrimaryTypes: ['street_address'],
                    sessionToken: sessionTokenRef.current
                }

                if (countryCode) {
                    request.includedRegionCodes = [countryCode]
                }

                const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)

                const googleSuggestions = convertGoogleMapsSuggestions(response.suggestions)

                // Store in cache for future use
                cacheRef.current.set(cacheKey, googleSuggestions)

                setSuggestions(googleSuggestions)
            } catch (error) {
                setSuggestions([])
            } finally {
                setIsLoading(false)
            }
        },
        [places, countryCode, getCacheKey]
    )

    const resetSession = useCallback(() => {
        sessionTokenRef.current = null
        setSuggestions([])
        setIsLoading(false)
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }
    }, [])

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }

        if (!inputString || inputString.length < 3) {
            setSuggestions([])
            return
        }

        debounceTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(inputString)
        }, DEBOUNCE_DELAY)

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
        }
    }, [inputString, fetchSuggestions])

    return {
        suggestions,
        isLoading,
        resetSession,
        fetchSuggestions
    }
}
