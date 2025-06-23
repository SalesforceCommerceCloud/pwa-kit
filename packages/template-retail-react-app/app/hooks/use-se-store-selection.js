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
import {cleanURLParams} from '@salesforce/retail-react-app/app/components/se-input-handler'
import {
    STORE_LOCATOR_RADIUS,
    STORE_LOCATOR_RADIUS_UNIT,
    STORE_LOCATOR_DEFAULT_COUNTRY_CODE
} from '@salesforce/retail-react-app/app/constants'
import {useLocation, useHistory} from 'react-router-dom'

const useSeStoreSelection = (totalItemCount) => {
    const intl = useIntl()
    const {site} = useMultiSite()
    const location = useLocation()
    const history = useHistory()
    const [locationData, setLocationData] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [shouldOpenModal, setShouldOpenModal] = useState(false)
    const [storeLocatorParams, setStoreLocatorParams] = useState(null)
    const [enableCoordinateSearch, setEnableCoordinateSearch] = useState(false)

    const storeInfoKey = `store_${site.id}`

    const getCountryForPostalSearch = useCallback((explicitCountry) => {
        return explicitCountry && explicitCountry !== 'none'
            ? explicitCountry
            : STORE_LOCATOR_DEFAULT_COUNTRY_CODE
    }, [])

    const addCountryCode = useCallback((params, countryCode) => ({
        ...params,
        ...(countryCode ? { countryCode } : {})
    }), [])

    const createBaseStoreParams = useCallback((countryCode) => ({
        ...(countryCode ? { countryCode } : {}),
        maxDistance: STORE_LOCATOR_RADIUS,
        distanceUnit: STORE_LOCATOR_RADIUS_UNIT,
        limit: 50
    }), [])

    const {data: coordinateStoreData, isLoading: isLoadingCoordinateStores} = useSearchStores({
        parameters: addCountryCode({
            latitude: locationData?.latitude,
            longitude: locationData?.longitude,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_RADIUS,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        }, locationData?.countryCode ? getCountryForPostalSearch(locationData?.countryCode) : null),
        enabled:
            enableCoordinateSearch && Boolean(locationData?.latitude && locationData?.longitude)
    })

    const countryCodeToUse = getCountryForPostalSearch(
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
        parameters: addCountryCode({
            latitude: cityCoords?.lat,
            longitude: cityCoords?.lng,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_RADIUS,
            limit: 200,
            distanceUnit: STORE_LOCATOR_RADIUS_UNIT
        }, locationData?.countryCode ? getCountryForPostalSearch(locationData?.countryCode) : null),
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


    const filterStoresByCountryAndDistance = useCallback((storeData) => {
        if (!storeData?.data) return storeData
        
        const filteredStores = storeData.data.filter(store => {

            let countryMatch = true
            if (locationData?.countryCode) {
                const targetCountry = getCountryForPostalSearch(locationData.countryCode)
                const storeCountry = store.countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE
                countryMatch = storeCountry === targetCountry
            }
            const distanceMatch = !store.distance || store.distance <= STORE_LOCATOR_RADIUS
            
            return countryMatch && distanceMatch
        })
        
        return {
            ...storeData,
            data: filteredStores,
            total: filteredStores.length
        }
    }, [locationData?.countryCode, getCountryForPostalSearch])

    const getStoreSearchData = () => {
        let rawData = null
        
        if (coordinateStoreData) rawData = coordinateStoreData
        else if (postalCodeStoreData && locationData?.zipcode) rawData = postalCodeStoreData
        else if (cityStoreData) rawData = cityStoreData
        else if (
            locationData?.storeName &&
            locationData?.countryCode &&
            !locationData?.zipcode &&
            !locationData?.city &&
            combinedStoresData
        ) rawData = combinedStoresData
        return rawData ? filterStoresByCountryAndDistance(rawData) : null
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

        const applyFilters = (matches) => {
            const filters = [
                [countryCode, (s) => (s.countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE) === countryCode],
                [zipcode, (s) => (s.postalCode || s.address?.postalCode) === zipcode],
                [city, (s) => (s.city || s.address?.city || '').toLowerCase().includes(city.toLowerCase())]
            ]

            let result = matches
            for (const [condition, filterFn] of filters) {
                if (condition && result.length > 0) {
                    const filtered = result.filter(filterFn)
                    if (filtered.length > 0) result = filtered
                }
            }
            return result
        }
        if (storeName) {
            const searchNameLower = storeName.toLowerCase().trim()
            const exactMatches = stores.filter(store => {
                const storeNameLower = (store.name || '').toLowerCase().trim()
                return storeNameLower === searchNameLower
            })

            if (exactMatches.length > 0) {
                const filtered = applyFilters(exactMatches)
                if (filtered.length > 0) return filtered[0]
            }


            const partialMatches = stores.filter(store => {
                const storeNameLower = (store.name || '').toLowerCase().trim()
                return storeNameLower.includes(searchNameLower) || searchNameLower.includes(storeNameLower)
            })

            if (partialMatches.length > 0) {
                const filtered = applyFilters(partialMatches)
                if (filtered.length > 0) return filtered[0]
            }
        }
        if (zipcode) {
            const zipMatches = stores.filter(store => {
                const storeZip = store.postalCode || store.address?.postalCode
                return storeZip === zipcode
            })
            if (zipMatches.length > 0) return zipMatches[0]
        }
        if (city) {
            const cityMatches = stores.filter(store => {
                const storeCity = (store.city || store.address?.city || '').toLowerCase()
                return storeCity.includes(city.toLowerCase())
            })
            if (cityMatches.length > 0) return cityMatches[0]
        }

        return stores[0]
    }, [])

    useEffect(() => {
        if (totalItemCount > 0) {
            const urlParams = new URLSearchParams(location.search)
            const hasSeParamsList = ['lat', 'lng', 'zip', 'city', 'store', 'country']
            const hasSeParams = hasSeParamsList.some((key) => urlParams.has(key))
            if (hasSeParams) {
                cleanURLParams(location, history, hasSeParamsList)
                setLocationData(null)
            }
            return
        }
        if (storeSearchData?.data && locationData && isProcessing) {
            const countryCode = locationData.countryCode ? getCountryForPostalSearch(locationData.countryCode) : null
            const searchCriteria = {
                ...locationData,
                countryCode
            }
            const selectedStore =
                findMatchingStore(storeSearchData.data, searchCriteria) || storeSearchData.data[0]

            if (selectedStore) {
                let seSearchParams = {}
                if (locationData.latitude && locationData.longitude) {
                    seSearchParams = addCountryCode({
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                    }, selectedStore?.countryCode)
                } else if (locationData.zipcode) {
                    seSearchParams = addCountryCode({
                        postalCode: locationData.zipcode
                    }, countryCode)
                } else if (locationData.city && cityCoords) {
                    if (cityCoords.postalCode) {
                        seSearchParams = addCountryCode({
                            postalCode: cityCoords.postalCode
                        }, cityCoords.country)
                    } else {
                        seSearchParams = addCountryCode({
                            latitude: cityCoords.lat,
                            longitude: cityCoords.lng
                        }, cityCoords.country)
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
                        ...createBaseStoreParams(countryCode),
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                    })
                } else if (locationData.zipcode) {
                    setStoreLocatorParams({
                        ...createBaseStoreParams(countryCode),
                        postalCode: locationData.zipcode
                    })
                } else if (locationData.city && cityCoords) {
                    if (cityCoords.postalCode) {
                        setStoreLocatorParams({
                            ...createBaseStoreParams(cityCoords.country),
                            postalCode: cityCoords.postalCode
                        })
                    } else {
                        setStoreLocatorParams({
                            ...createBaseStoreParams(cityCoords.country),
                            latitude: cityCoords.lat,
                            longitude: cityCoords.lng
                        })
                    }
                }

                setShouldOpenModal(true)

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('seStoreSelected', {
                            detail: addCountryCode({
                                store: selectedStore,
                                source: 'search_engine',
                                hasStoreName: Boolean(locationData.storeName),
                                selectionMethod: locationData.storeName
                                    ? 'name_match'
                                    : 'nearest_location'
                            }, countryCode)
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
        cityCoords,
        totalItemCount
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
                const countryCode = country ? getCountryForPostalSearch(country) : null

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
