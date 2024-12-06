/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import type {DeviceCoordinates} from './provider'

export function useGeolocation(options = {}) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<GeolocationPositionError | null>(null)
    const [coordinates, setCoordinates] = useState<DeviceCoordinates>({
        latitude: null,
        longitude: null
    })

    const getLocation = () => {
        setLoading(true)
        setError(null)

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by this browser.')
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                    setLoading(false)
                },
                (err) => {
                    setError(err instanceof GeolocationPositionError ? err : null)
                    setLoading(false)
                },
                options
            )
        } catch (err) {
            setError(err instanceof GeolocationPositionError ? err : null)
            setLoading(false)
        }
    }

    useEffect(() => {
        getLocation()
    }, [])

    return {
        coordinates,
        loading,
        error,
        refresh: getLocation
    }
}
