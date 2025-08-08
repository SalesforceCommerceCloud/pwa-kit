/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useRef, useCallback, useEffect, useContext} from 'react'
import {useMapsLibrary } from '@vis.gl/react-google-maps'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {convertGoogleMapsSuggestions} from '../utils/address-suggestions'
import {useCheckout} from '../pages/checkout/util/checkout-context'

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
    const {googleMapsLoaded} = useCheckout()

    // stores the current sessionToken - REUSED across multiple calls
    const sessionTokenRef = useRef(null)

    // the suggestions based on the specified input
    const [suggestions, setSuggestions] = useState([])

    // indicates if there is currently an incomplete request to the places API
    const [isLoading, setIsLoading] = useState(false)

    // Debounce timeout ref
    const debounceTimeoutRef = useRef(null)

    // Fetch suggestions from Google Maps API
    const fetchSuggestions = useCallback(
        async (input) => {
            if (!googleMapsLoaded || !input || input.length < 3) {
                setSuggestions([])
                return
            }

            setIsLoading(true)

            try {
                const {AutocompleteSessionToken, AutocompleteSuggestion} = google.maps.places

                // Create a new session token if one doesn't exist - REUSE SESSION
                if (!sessionTokenRef.current) {
                    sessionTokenRef.current = new AutocompleteSessionToken()
                }

                // Create the request
                const request = {
                    ...requestOptions,
                    input: input,
                    includedPrimaryTypes: ['street_address'],
                    sessionToken: sessionTokenRef.current // REUSED SESSION TOKEN
                }

                // Places API (New) uses includedRegionCodes
                if (countryCode) {
                    request.includedRegionCodes = [countryCode]
                }

                // Get suggestions from Google Maps API
                const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)

                // Convert Google Maps format to our expected format
                const googleSuggestions = convertGoogleMapsSuggestions(response.suggestions)

                setSuggestions(googleSuggestions)
            } catch (error) {
                setSuggestions([])
            } finally {
                setIsLoading(false)
            }
        },
        [googleMapsLoaded, countryCode]
    )

    // Reset session and clear suggestions
    const resetSession = useCallback(() => {
        sessionTokenRef.current = null // Clear the reused session token
        setSuggestions([])
        setIsLoading(false)
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }
    }, [])

    // Effect to handle input changes with debouncing
    useEffect(() => {
        // Clear any existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }

        // If input is too short, clear suggestions
        if (!inputString || inputString.length < 3) {
            setSuggestions([])
            return
        }

        // Debounce the API call
        debounceTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(inputString)
        }, DEBOUNCE_DELAY)

        // Cleanup function
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
