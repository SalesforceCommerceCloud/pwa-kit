/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useEffect, useCallback, useMemo, useContext} from 'react'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {useIntl} from 'react-intl'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/contexts/store-locator-provider'
import {
    STORE_LOCATOR_RADIUS,
    STORE_LOCATOR_RADIUS_UNIT,
    STORE_LOCATOR_DEFAULT_COUNTRY_CODE
} from '@salesforce/retail-react-app/app/constants'
import {cleanURLParams} from '@salesforce/retail-react-app/app/components/se-input-handler'
import {useLocation, useHistory} from 'react-router-dom'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

const useSeStoreSelection = () => {
    const intl = useIntl()
    const storeLocatorContext = useContext(StoreLocatorContext)
    const [locationData, setLocationData] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [shouldOpenModal, setShouldOpenModal] = useState(false)
    const [storeLocatorParams, setStoreLocatorParams] = useState(null)
    const [enableCoordinateSearch, setEnableCoordinateSearch] = useState(false)
    const location = useLocation()
    const history = useHistory()
    const {derivedData} = useCurrentBasket()
    const hasItemsInBasket = derivedData?.totalItems > 0

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
                    (s) => (s.countryCode || STORE_LOCATOR_DEFAULT_COUNTRY_CODE) === countryCode
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
        if (hasItemsInBasket) {
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
            const countryCode = getCountryForPostalSearch(
                locationData.zipcode,
                locationData.countryCode
            )
            const searchCriteria = {
                ...locationData,
                countryCode: locationData.countryCode || countryCode
            }

            let selectedStore = null
            if (locationData.storeName) {
                selectedStore = findMatchingStore(storeSearchData.data, searchCriteria)
            }

            if (!selectedStore) {
                selectedStore =
                    findMatchingStore(storeSearchData.data, searchCriteria) ||
                    storeSearchData.data[0]
            }

            if (selectedStore) {
                if (storeLocatorContext?.setState) {
                    storeLocatorContext.setState((prevState) => ({
                        ...prevState,
                        selectedStoreId: selectedStore.id,
                        isSeSelection: true,
                        mode: 'input',
                        formValues: locationData.zipcode
                            ? {
                                  countryCode: locationData.countryCode || countryCode,
                                  postalCode: locationData.zipcode
                              }
                            : {
                                  countryCode: selectedStore.countryCode,
                                  postalCode: selectedStore.postalCode
                              }
                    }))
                }

                if (locationData.storeName) {
                    setStoreLocatorParams({
                        postalCode: locationData.zipcode || selectedStore.postalCode,
                        countryCode: locationData.countryCode || selectedStore.countryCode,
                        limit: 50
                    })
                } else if (locationData.latitude && locationData.longitude) {
                    setStoreLocatorParams({
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        postalCode: locationData.zipcode || selectedStore?.postalCode,
                        countryCode: locationData.countryCode || selectedStore?.countryCode,
                        limit: 50
                    })
                } else if (locationData.zipcode) {
                    setStoreLocatorParams({
                        postalCode: locationData.zipcode,
                        countryCode: countryCode,
                        limit: 50
                    })
                } else if (locationData.city) {
                    setStoreLocatorParams({
                        postalCode: selectedStore?.postalCode,
                        countryCode: selectedStore?.countryCode || countryCode,
                        limit: 50
                    })
                }

                setShouldOpenModal(true)
            }

            setIsProcessing(false)
        }
    }, [storeSearchData, locationData, isProcessing, findMatchingStore, getCountryForPostalSearch])

    const processSeParameters = useCallback(
        (urlParams) => {
            const hasSeParams = ['lat', 'lng', 'zip', 'city', 'store', 'country'].some((p) =>
                urlParams.has(p)
            )

            if (!hasSeParams) {
                if (storeLocatorContext?.state?.isSeSelection) {
                    return
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

            if (storeName) {
                setLocationData({
                    storeName,
                    zipcode,
                    countryCode: country || STORE_LOCATOR_DEFAULT_COUNTRY_CODE
                })
            } else if (parsedLat && parsedLng) {
                setLocationData({
                    latitude: parsedLat,
                    longitude: parsedLng,
                    countryCode: country
                })
            } else if (zipcode) {
                setLocationData({
                    zipcode,
                    countryCode: country
                })
            } else if (city) {
                setLocationData({
                    city,
                    countryCode: country
                })
            }

            setIsProcessing(true)
        },
        [storeLocatorContext?.state?.isSeSelection]
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
