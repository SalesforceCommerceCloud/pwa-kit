/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useAutocompleteSuggestions} from '@salesforce/retail-react-app/app/hooks/useAutocompleteSuggestions'
import {useMapsLibrary} from '@vis.gl/react-google-maps'

// Import the mocked useCheckout function
import {useCheckout} from '../pages/checkout/util/checkout-context'

jest.mock('@vis.gl/react-google-maps', () => ({
    useMapsLibrary: jest.fn()
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            googleCloudAPI: {
                apiKey: 'test-api-key'
            }
        }
    }))
}))

jest.mock('../pages/checkout/util/checkout-context', () => ({
    useCheckout: jest.fn(() => ({
        configurations: {
            configurations: [
                {
                    id: 'gcp',
                    value: 'test-api-key'
                }
            ]
        }
    }))
}))

describe('useAutocompleteSuggestions', () => {
    let mockPlaces
    let mockAutocompleteSessionToken
    let mockAutocompleteSuggestion

    const waitForDebounce = async (time = 300) => {
        await act(async () => {
            jest.advanceTimersByTime(time)
            await Promise.resolve()
        })
    }

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()

        mockAutocompleteSessionToken = jest.fn()

        mockAutocompleteSuggestion = {
            fetchAutocompleteSuggestions: jest.fn()
        }

        mockPlaces = {
            AutocompleteSessionToken: mockAutocompleteSessionToken,
            AutocompleteSuggestion: mockAutocompleteSuggestion
        }

        useMapsLibrary.mockReturnValue(mockPlaces)

        // Reset useCheckout mock to default
        useCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'test-api-key'
                    }
                ]
            }
        })
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

        await waitForDebounce()

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

        await waitForDebounce()

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

        await waitForDebounce()

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

        await waitForDebounce()

        expect(result.current.suggestions).toHaveLength(1)
        expect(result.current.suggestions[0].description).toContain('Canada')
    })

    it('should handle API errors gracefully', async () => {
        mockAutocompleteSuggestion.fetchAutocompleteSuggestions.mockRejectedValue(
            new Error('API Error')
        )

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        await waitForDebounce()

        expect(result.current.suggestions).toEqual([])
        expect(result.current.isLoading).toBe(false)
    })

    it('should reset session when resetSession is called', async () => {
        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

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

        await waitForDebounce()

        expect(result.current.suggestions).toHaveLength(1)

        act(() => {
            result.current.resetSession()
        })

        expect(result.current.suggestions).toEqual([])
        expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch suggestions when places library is not available', async () => {
        useMapsLibrary.mockReturnValue(null)

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        await waitForDebounce()

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()
        expect(result.current.suggestions).toEqual([])
    })

    it('should not fetch suggestions when the places API is undefined', async () => {
        useMapsLibrary.mockReturnValue(undefined)

        const {result} = renderHook(() => useAutocompleteSuggestions('123 Main', 'US'))

        await waitForDebounce()

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()
        expect(result.current.suggestions).toEqual([])
    })

    it('should debounce API calls', async () => {
        const mockPlaces = {
            AutocompleteSessionToken: jest.fn(() => ({})),
            AutocompleteSuggestion: {
                fetchAutocompleteSuggestions:
                    mockAutocompleteSuggestion.fetchAutocompleteSuggestions
            }
        }
        useMapsLibrary.mockReturnValue(mockPlaces)

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

        await act(async () => {
            rerender({input: '1234', country: 'US'})
        })

        await act(async () => {
            rerender({input: '12345', country: 'US'})
        })

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).not.toHaveBeenCalled()

        await waitForDebounce()

        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).toHaveBeenCalledTimes(1)
        expect(mockAutocompleteSuggestion.fetchAutocompleteSuggestions).toHaveBeenCalledWith(
            expect.objectContaining({
                input: '12345'
            })
        )
    })
})
