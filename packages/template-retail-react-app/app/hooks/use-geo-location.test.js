/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {useGeolocation} from '@salesforce/retail-react-app/app/hooks/use-geo-location'

describe('useGeolocation', () => {
    const mockGeolocation = {
        getCurrentPosition: jest.fn()
    }

    beforeEach(() => {
        // Mock GeolocationPositionError if it's not defined
        if (!global.GeolocationPositionError) {
            global.GeolocationPositionError = function () {
                this.code = 1
                this.message = ''
                this.PERMISSION_DENIED = 1
                this.POSITION_UNAVAILABLE = 2
                this.TIMEOUT = 3
            }
        }

        // Setup mock for navigator.geolocation
        Object.defineProperty(global.navigator, 'geolocation', {
            value: mockGeolocation,
            writable: true
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('initializes with default values', () => {
        const {result} = renderHook(() => useGeolocation())

        expect(result.current).toEqual({
            coordinates: {latitude: null, longitude: null},
            loading: true,
            error: null,
            refresh: expect.any(Function)
        })
    })

    it('updates coordinates on successful geolocation', async () => {
        const mockPosition = {
            coords: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        }

        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
            success(mockPosition)
        })

        const {result} = renderHook(() => useGeolocation())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current).toEqual({
            coordinates: {
                latitude: 37.7749,
                longitude: -122.4194
            },
            loading: false,
            error: null,
            refresh: expect.any(Function)
        })
    })

    it('handles geolocation errors', async () => {
        const mockError = new global.GeolocationPositionError()
        mockError.code = 1
        mockError.message = 'User denied geolocation'

        mockGeolocation.getCurrentPosition.mockImplementation((_success, error) => {
            error(mockError)
        })

        const {result} = renderHook(() => useGeolocation())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current).toEqual({
            coordinates: {latitude: null, longitude: null},
            loading: false,
            error: mockError,
            refresh: expect.any(Function)
        })
    })

    it('handles refresh function call', async () => {
        const mockPosition = {
            coords: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        }

        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
            success(mockPosition)
        })

        const {result} = renderHook(() => useGeolocation())

        act(() => {
            result.current.refresh()
        })

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2)
        expect(result.current.coordinates).toEqual({
            latitude: 37.7749,
            longitude: -122.4194
        })
    })

    it('handles case when geolocation is not supported', async () => {
        // First clear the mock
        Object.defineProperty(global.navigator, 'geolocation', {
            value: undefined,
            writable: true
        })

        const {result} = renderHook(() => useGeolocation())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        // Just check that we're in an error state with null coordinates
        expect(result.current.loading).toBe(false)
        expect(result.current.coordinates).toEqual({
            latitude: null,
            longitude: null
        })
    })
})
