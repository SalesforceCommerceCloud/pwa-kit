/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useAutocompleteSuggestions} from '@salesforce/retail-react-app/../../app/hooks/useAutocompleteSuggestions'
import {useMapsLibrary} from '@vis.gl/react-google-maps'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Mock the Google Maps library
jest.mock('@vis.gl/react-google-maps', () => ({
    useMapsLibrary: jest.fn()
}))

// Mock the config
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            googleCloudAPI: {
                apiKey: 'test-api-key'
            }
        }
    }))
}))

describe('useAutocompleteSuggestions', () => {
    let mockPlaces
    let mockAutocompleteSessionToken
    let mockAutocompleteSuggestion

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()

        // Mock session token
        mockAutocompleteSessionToken = jest.fn()

        // Mock autocomplete suggestion
        mockAutocompleteSuggestion = {
            fetchAutocompleteSuggestions: jest.fn()
        }

        // Mock places library
        mockPlaces = {
            AutocompleteSessionToken: mockAutocompleteSessionToken,
            AutocompleteSuggestion: mockAutocompleteSuggestion
        }

        // Setup the mock to return our mock places
        useMapsLibrary.mockReturnValue(mockPlaces)
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should return initial state', () => {
        const {result} = renderHook(() => useAutocompleteSuggestions('', ''))

        expect(result.current.suggestions).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(typeof result.current.resetSession).toBe('function')
        expect(typeof result.current.fetchSuggestions).toBe('function')
    })

    it('should not fetch suggestions for input shorter than 3 characters', async () => {
        const {result} = renderHook(() => useAutocompleteSuggestions('ab', 'US'))

        // Wait for any potential API calls
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
        })

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()
        expect(result.current.suggestions).toEqual([])
    })

    it('should fetch suggestions for valid input', async () => {
        const mockResponse = {
            suggestions: [
                {
                    placePrediction: {
                        text: {text: '123 Main St, New York, NY 10001, USA'},
                        placeId: 'test-place-id'
                    }
                }
            ]
        }

        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue(mockResponse)

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        // Wait for debounce and API call
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).toHaveBeenCalledWith({
            input: '123 Main',
            includedPrimaryTypes: ['street_address'],
            sessionToken: expect.any(Object),
            includedRegionCodes: ['US']
        })

        expect(result.current.suggestions).toHaveLength(1)
        expect(result.current.suggestions[0]).toMatchObject({
            description: '123 Main St, New York, NY 10001, USA',
            place_id: 'test-place-id',
            structured_formatting: {
                main_text: '123 Main St',
                secondary_text: 'New York, NY 10001, USA'
            }
        })
    })

    it('should filter suggestions by country for US', async () => {
        const mockResponse = {
            suggestions: [
                {
                    placePrediction: {
                        text: {text: '123 Main St, New York, NY 10001, USA'},
                        placeId: 'us-place-id'
                    }
                }
            ]
        }

        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue(mockResponse)

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        // Wait for debounce and API call
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(result.current.suggestions).toHaveLength(1)
        expect(result.current.suggestions[0].description).toContain('USA')
    })

    it('should filter suggestions by country for Canada', async () => {
        const mockResponse = {
            suggestions: [
                {
                    placePrediction: {
                        text: {text: '456 Oak Ave, Toronto, ON M5C 1W4, Canada'},
                        placeId: 'ca-place-id'
                    }
                }
            ]
        }

        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue(mockResponse)

        const {result} = renderHook(() => useAutocompleteSuggestions('456 Oak', 'CA'))

        // Wait for debounce and API call
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(result.current.suggestions).toHaveLength(1)
        expect(result.current.suggestions[0].description).toContain('Canada')
    })

    it('should handle API errors gracefully', async () => {
        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockRejectedValue(
            new Error('API Error')
        )

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        // Wait for debounce and API call
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching address suggestions:',
            expect.any(Error)
        )
        expect(result.current.suggestions).toEqual([])
        expect(result.current.isLoading).toBe(false)

        consoleSpy.mockRestore()
    })

    it('should reset session when resetSession is called', async () => {
        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        // First, trigger some suggestions
        const mockResponse = {
            suggestions: [
                {
                    placePrediction: {
                        text: {text: '123 Main St, New York, NY 10001, USA'},
                        placeId: 'test-place-id'
                    }
                }
            ]
        }

        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue(mockResponse)

        // Wait for initial suggestions
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(result.current.suggestions).toHaveLength(1)

        // Now reset the session
        act(() => {
            result.current.resetSession()
        })

        expect(result.current.suggestions).toEqual([])
        expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch suggestions when places library is not available', async () => {
        useMapsLibrary.mockReturnValue(null)

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        // Wait for any potential API calls
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
        })

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()
        expect(result.current.suggestions).toEqual([])
    })

    it('should not fetch suggestions when API key is not available', async () => {
        getConfig.mockReturnValue({
            app: {
                googleCloudAPI: {}
            }
        })

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        // Wait for any potential API calls
        await act(async () => {
            jest.advanceTimersByTime(350)
            await Promise.resolve()
        })

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()
        expect(result.current.suggestions).toEqual([])
    })

    it('should debounce API calls', async () => {
        // Mock useMapsLibrary to return a valid object
        const mockPlaces = {
            AutocompleteSessionToken: jest.fn(() => ({})),
            AutocompleteSuggestion: {
                fetchAutocompleteSuggestions:
                    mockAutocompleteSuggestion.fetchAutocompleteSuggestions
            }
        }
        useMapsLibrary.mockReturnValue(mockPlaces)
        // Mock getConfig to return a valid apiKey
        getConfig.mockReturnValue({app: {googleCloudAPI: {apiKey: 'test-key'}}})

        const mockResponse = {
            suggestions: [
                {
                    placePrediction: {
                        text: {text: '123 Main St, New York, NY 10001, USA'},
                        placeId: 'test-place-id'
                    }
                }
            ]
        }

        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue(mockResponse)

        const {rerender} = renderHook(
            ({input, country}) => useAutocompleteSuggestions(input, country),
            {initialProps: {input: '123', country: 'US'}}
        )

        // Rapidly change input before debounce time elapses
        await act(async () => {
            rerender({input: '1234', country: 'US'})
        })

        await act(async () => {
            rerender({input: '12345', country: 'US'})
        })

        // Should not have called API yet
        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()

        // Advance timers by debounce delay and flush all pending promises
        await act(async () => {
            jest.advanceTimersByTime(300)
            // Flush all pending promises
            await Promise.resolve()
            await Promise.resolve()
        })

        // Should have called API once with the last input
        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).toHaveBeenCalledTimes(1)
        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).toHaveBeenCalledWith(
            expect.objectContaining({
                input: '12345'
            })
        )
    })
})
