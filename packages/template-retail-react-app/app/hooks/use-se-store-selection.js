/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useEffect, useCallback, useMemo} from 'react'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {useIntl} from 'react-intl'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {
    STORE_LOCATOR_RADIUS,
    STORE_LOCATOR_RADIUS_UNIT,
    STORE_LOCATOR_DEFAULT_COUNTRY_CODE
} from '@salesforce/retail-react-app/app/constants'

const useSeStoreSelection = () => {
    const intl = useIntl()
    const {site} = useMultiSite()
    const [locationData, setLocationData] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [shouldOpenModal, setShouldOpenModal] = useState(false)
    const [storeLocatorParams, setStoreLocatorParams] = useState(null)
    const [enableCoordinateSearch, setEnableCoordinateSearch] = useState(false)

    const storeInfoKey = `store_${site.id}`

    const getCountryForPostalSearch = useCallback((zipcode, explicitCountry) => {
        return explicitCountry && explicitCountry !== 'none'
            ? explicitCountry
            : STORE_LOCATOR_DEFAULT_COUNTRY_CODE
    }, [])

    const {data: coordinateStoreData, isLoading: isLoadingCoordinateStores} = useSearchStores({
        parameters: {
            latitude: locationData?.latitude,
            longitude: locationData?.longitude,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_RADIUS,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        },
        enabled:
            enableCoordinateSearch && Boolean(locationData?.latitude && locationData?.longitude)
    })

    const countryCodeToUse = getCountryForPostalSearch(
        locationData?.zipcode,
        locationData?.countryCode
    )

    const {data: postalCodeStoreData, isLoading: isLoadingPostalStores} = useSearchStores({
        parameters: {
            postalCode: locationData?.zipcode,
            countryCode: countryCodeToUse,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_RADIUS,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        },
        enabled: Boolean(locationData?.zipcode && !locationData?.latitude)
    })

    const getGlobalSearchParams = useCallback(() => {
        const baseDistance = STORE_LOCATOR_RADIUS * 200
        const storeNameDistance =
            locationData?.storeName && locationData?.countryCode ? baseDistance * 2 : baseDistance

        return {
            latitude: 0,
            longitude: 0,
            locale: intl.locale,
            maxDistance: storeNameDistance,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        }
    }, [locationData?.storeName, locationData?.countryCode, intl.locale])

    const {data: allStoresData, isLoading: isLoadingAllStores} = useSearchStores({
        parameters: getGlobalSearchParams(),
        enabled: Boolean(
            (locationData?.city && !locationData?.latitude && !locationData?.zipcode) ||
                (locationData?.storeName &&
                    locationData?.countryCode &&
                    !locationData?.zipcode &&
                    !locationData?.latitude)
        )
    })

    const needsFallbackSearch = Boolean(
        locationData?.storeName &&
            locationData?.countryCode &&
            !locationData?.zipcode &&
            !locationData?.latitude &&
            !isLoadingAllStores &&
            (!allStoresData?.data?.length ||
                (allStoresData?.data?.length > 0 &&
                    !allStoresData.data.some((store) => {
                        const sName = (store.name || '').toLowerCase().trim()
                        const searchName = locationData.storeName.toLowerCase().trim()
                        const countryMatch =
                            (store.countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE) ===
                            locationData.countryCode
                        return (sName === searchName || sName.includes(searchName)) && countryMatch
                    })))
    )

    const getFallbackSearchParams = useCallback(() => {
        const maxDistance = STORE_LOCATOR_RADIUS * 500

        return {
            latitude: 0,
            longitude: 0,
            locale: intl.locale,
            maxDistance,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        }
    }, [intl.locale])

    const {data: fallbackStoresData, isLoading: isLoadingFallbackStores} = useSearchStores({
        parameters: getFallbackSearchParams(),
        enabled: needsFallbackSearch
    })

    const combinedStoresData = allStoresData?.data?.length ? allStoresData : fallbackStoresData
    const getCityCoordinatesFromStores = useCallback(
        (cityName, countryCode) => {
            const stores = combinedStoresData?.data || []
            if (stores.length === 0) return null

            const cityKey = cityName.toLowerCase().trim()
            const defaultCountry = countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE

            let cityStores = stores.filter((store) => {
                const storeCity = (store.city || '').toLowerCase().trim()
                const storeCountry = store.countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE
                const cityMatch =
                    storeCity === cityKey ||
                    storeCity.includes(cityKey) ||
                    cityKey.includes(storeCity)

                return (
                    cityMatch &&
                    storeCountry === defaultCountry &&
                    store.latitude &&
                    store.longitude
                )
            })

            if (cityStores.length === 0) {
                cityStores = stores.filter((store) => {
                    const storeCity = (store.city || '').toLowerCase().trim()
                    const cityMatch =
                        storeCity === cityKey ||
                        storeCity.includes(cityKey) ||
                        cityKey.includes(storeCity)

                    return cityMatch && store.latitude && store.longitude
                })
            }

            if (cityStores.length === 0) return null

            const firstStore = cityStores[0]
            return {
                lat: firstStore.latitude,
                lng: firstStore.longitude,
                country: firstStore.countryCode,
                city: firstStore.city,
                postalCode: firstStore.postalCode,
                storeCount: cityStores.length,
                storeName: firstStore.name
            }
        },
        [combinedStoresData]
    )

    const cityCoords = useMemo(() => {
        if (!locationData?.city || isLoadingAllStores) return null
        return getCityCoordinatesFromStores(locationData.city, locationData?.countryCode)
    }, [
        locationData?.city,
        locationData?.countryCode,
        getCityCoordinatesFromStores,
        isLoadingAllStores
    ])

    const {data: cityStoreData, isLoading: isLoadingCityStores} = useSearchStores({
        parameters: {
            latitude: cityCoords?.lat,
            longitude: cityCoords?.lng,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_RADIUS * 5,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        },
        enabled: Boolean(
            cityCoords &&
                locationData?.city &&
                !locationData?.latitude &&
                !locationData?.zipcode &&
                !isLoadingAllStores
        )
    })

    useEffect(() => {
        setEnableCoordinateSearch(Boolean(locationData?.latitude && locationData?.longitude))
    }, [locationData?.latitude, locationData?.longitude])

    const getStoreSearchData = () => {
        if (coordinateStoreData) return coordinateStoreData

        if (postalCodeStoreData && locationData?.zipcode) return postalCodeStoreData

        if (cityStoreData) return cityStoreData

        if (
            locationData?.storeName &&
            locationData?.countryCode &&
            !locationData?.zipcode &&
            !locationData?.city &&
            combinedStoresData
        ) {
            return combinedStoresData
        }
        return null
    }

    const storeSearchData = getStoreSearchData()
    const isLoadingStores =
        isLoadingCoordinateStores ||
        isLoadingPostalStores ||
        isLoadingCityStores ||
        isLoadingAllStores ||
        isLoadingFallbackStores

    const findMatchingStore = useCallback((stores, searchCriteria) => {
        if (!stores || stores.length === 0) return null

        const {storeName, zipcode, city, countryCode} = searchCriteria

        if (storeName) {
            const searchNameLower = storeName.toLowerCase().trim()
            const filters = [
                [
                    countryCode,
                    (s) =>
                        (s.countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE) === countryCode
                ],
                [zipcode, (s) => (s.postalCode || s.address?.postalCode) === zipcode],
                [
                    city,
                    (s) =>
                        (s.city || s.address?.city || '').toLowerCase().includes(city.toLowerCase())
                ]
            ]

            let exactMatches = stores.filter((store) => {
                const storeNameLower = (store.name || '').toLowerCase().trim()
                return storeNameLower === searchNameLower
            })

            if (exactMatches.length > 0) {
                let nameMatches = exactMatches
                for (const [condition, filterFn] of filters) {
                    if (condition && nameMatches.length > 0) {
                        const filtered = nameMatches.filter(filterFn)
                        if (filtered.length > 0) nameMatches = filtered
                    }
                }

                if (nameMatches.length > 0) return nameMatches[0]
            }

            let nameMatches = stores.filter((store) => {
                const storeNameLower = (store.name || '').toLowerCase().trim()
                return (
                    storeNameLower.includes(searchNameLower) ||
                    searchNameLower.includes(storeNameLower)
                )
            })

            for (const [condition, filterFn] of filters) {
                if (condition && nameMatches.length > 0) {
                    const filtered = nameMatches.filter(filterFn)
                    if (filtered.length > 0) nameMatches = filtered
                }
            }

            if (nameMatches.length > 0) return nameMatches[0]
        }

        if (zipcode) {
            const zipMatches = stores.filter((store) => {
                const storeZip = store.postalCode || store.address?.postalCode
                return storeZip === zipcode
            })
            if (zipMatches.length > 0) return zipMatches[0]
        }

        if (city) {
            const cityMatches = stores.filter((store) => {
                const storeCity = (store.city || store.address?.city || '').toLowerCase()
                return storeCity.includes(city.toLowerCase())
            })
            if (cityMatches.length > 0) return cityMatches[0]
        }

        return stores.length > 0 ? stores[0] : null
    }, [])

    useEffect(() => {
        if (storeSearchData?.data && locationData && isProcessing) {
            const countryCode = getCountryForPostalSearch(
                locationData.zipcode,
                locationData.countryCode
            )
            const searchCriteria = {
                ...locationData,
                countryCode: locationData.countryCode || countryCode
            }
            const selectedStore =
                findMatchingStore(storeSearchData.data, searchCriteria) || storeSearchData.data[0]

            if (selectedStore) {
                let seSearchParams = {}
                if (locationData.latitude && locationData.longitude) {
                    seSearchParams = {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        countryCode: selectedStore?.countryCode
                    }
                } else if (locationData.zipcode) {
                    seSearchParams = {
                        postalCode: locationData.zipcode,
                        countryCode: countryCode
                    }
                } else if (locationData.city && cityCoords) {
                    if (cityCoords.postalCode) {
                        seSearchParams = {
                            postalCode: cityCoords.postalCode,
                            countryCode: cityCoords.country
                        }
                    } else {
                        seSearchParams = {
                            latitude: cityCoords.lat,
                            longitude: cityCoords.lng,
                            countryCode: cityCoords.country
                        }
                    }
                }

                if (typeof window !== 'undefined') {
                    localStorage.setItem(
                        storeInfoKey,
                        JSON.stringify({
                            id: selectedStore.id,
                            name: selectedStore.name || null,
                            inventoryId: selectedStore.inventoryId || null,
                            isSeSelection: true,
                            timestamp: Date.now(),
                            seSearchParams
                        })
                    )
                }

                if (locationData.latitude && locationData.longitude) {
                    setStoreLocatorParams({
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        postalCode: selectedStore?.postalCode,
                        countryCode: selectedStore?.countryCode,
                        limit: 50
                    })
                } else if (locationData.zipcode) {
                    setStoreLocatorParams({
                        postalCode: locationData.zipcode,
                        countryCode: countryCode,
                        limit: 50
                    })
                } else if (locationData.city && cityCoords) {
                    if (cityCoords.postalCode) {
                        setStoreLocatorParams({
                            postalCode: cityCoords.postalCode,
                            countryCode: cityCoords.country,
                            limit: 50
                        })
                    } else {
                        setStoreLocatorParams({
                            latitude: cityCoords.lat,
                            longitude: cityCoords.lng,
                            limit: 50
                        })
                    }
                }

                setShouldOpenModal(true)

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('seStoreSelected', {
                            detail: {
                                store: selectedStore,
                                source: 'search_engine',
                                hasStoreName: Boolean(locationData.storeName),
                                selectionMethod: locationData.storeName
                                    ? 'name_match'
                                    : 'nearest_location',
                                countryCode: countryCode
                            }
                        })
                    )
                }
            }

            setIsProcessing(false)
        }
    }, [
        storeSearchData,
        locationData,
        isProcessing,
        findMatchingStore,
        storeInfoKey,
        getCountryForPostalSearch,
        cityCoords
    ])

    const processSeParameters = useCallback(
        (urlParams) => {
            const hasSeParams = ['lat', 'lng', 'zip', 'city', 'store', 'country'].some((p) =>
                urlParams.has(p)
            )

            if (!hasSeParams) {
                if (typeof window !== 'undefined') {
                    const existingStore = localStorage.getItem(storeInfoKey)
                    if (existingStore) {
                        const storeData = JSON.parse(existingStore)
                        if (storeData.isSeSelection) {
                            return
                        }
                    }
                }
                return
            }

            const lat = urlParams.get('lat')
            const lng = urlParams.get('lng')
            const storeName = urlParams.get('store') || urlParams.get('Store')
            const zipcode = urlParams.get('zip')
            const city = urlParams.get('city')
            const country = urlParams.get('country')

            let parsedLat = null,
                parsedLng = null

            if (lat && lng) {
                parsedLat = parseFloat(lat)
                parsedLng = parseFloat(lng)
            }

            if ((parsedLat && parsedLng) || storeName || zipcode || city) {
                const countryCode = country || getCountryForPostalSearch(zipcode, null)

                setIsProcessing(true)
                setLocationData({
                    latitude: parsedLat,
                    longitude: parsedLng,
                    storeName,
                    zipcode,
                    city,
                    countryCode
                })
            }
        },
        [getCountryForPostalSearch, storeInfoKey]
    )

    return {
        isProcessing: isProcessing || isLoadingStores,
        shouldOpenModal,
        setShouldOpenModal,
        storeLocatorParams,
        processSeParameters
    }
}

export default useSeStoreSelection
