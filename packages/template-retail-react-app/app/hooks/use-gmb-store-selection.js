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
    STORE_LOCATOR_DISTANCE,
    STORE_LOCATOR_DISTANCE_UNIT,
    DEFAULT_STORE_LOCATOR_COUNTRY
} from '@salesforce/retail-react-app/app/constants'


const useGMBStoreSelection = () => {
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
            : DEFAULT_STORE_LOCATOR_COUNTRY.countryCode
    }, [])

    // Coordinate-based search
    const {
        data: coordinateStoreData,
        isLoading: isLoadingCoordinateStores
    } = useSearchStores({
        parameters: {
            latitude: locationData?.latitude,
            longitude: locationData?.longitude,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        },
        enabled: enableCoordinateSearch && Boolean(locationData?.latitude && locationData?.longitude)
    })

    const countryCodeToUse = getCountryForPostalSearch(locationData?.zipcode, locationData?.countryCode)
    
    const {
        data: postalCodeStoreData,
        isLoading: isLoadingPostalStores
    } = useSearchStores({
        parameters: {
            postalCode: locationData?.zipcode,
            countryCode: countryCodeToUse,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        },
        enabled: Boolean(locationData?.zipcode && !locationData?.latitude)
    })

    const {
        data: storeNameLocationData,
        isLoading: isLoadingStoreNameLocation
    } = useSearchStores({
        parameters: {
            postalCode: locationData?.zipcode,
            countryCode: countryCodeToUse,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        },
        enabled: Boolean(locationData?.storeName && locationData?.zipcode && !locationData?.latitude)
    })

    const getGlobalSearchParams = useCallback(() => {
        const baseDistance = STORE_LOCATOR_DISTANCE * 200
        const storeNameDistance = (locationData?.storeName && locationData?.countryCode) ? baseDistance * 2 : baseDistance
        
        return {
            latitude: DEFAULT_STORE_LOCATOR_COUNTRY.latitude || 0,
            longitude: DEFAULT_STORE_LOCATOR_COUNTRY.longitude || 0,
            locale: intl.locale,
            maxDistance: storeNameDistance,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        }
    }, [locationData?.storeName, locationData?.countryCode, intl.locale])

    // Global store search
    const {
        data: allStoresData,
        isLoading: isLoadingAllStores
    } = useSearchStores({
        parameters: getGlobalSearchParams(),
        enabled: Boolean((locationData?.city && !locationData?.latitude && !locationData?.zipcode) || 
                        (locationData?.storeName && locationData?.countryCode && !locationData?.zipcode && !locationData?.latitude))
    })

    // Fallback search when no results found
    const needsFallbackSearch = Boolean(
        locationData?.storeName && 
        locationData?.countryCode && 
        !locationData?.zipcode && 
        !locationData?.latitude && 
        !isLoadingAllStores && 
        (!allStoresData?.data?.length || 
         (allStoresData?.data?.length > 0 && !allStoresData.data.some(store => {
             const storeNameLower = (store.name || '').toLowerCase().trim()
             const searchNameLower = locationData.storeName.toLowerCase().trim()
             const countryMatch = (store.countryCode || DEFAULT_STORE_LOCATOR_COUNTRY.countryCode) === locationData.countryCode
             return (storeNameLower === searchNameLower || storeNameLower.includes(searchNameLower)) && countryMatch
         }))
        )
    )

    const getFallbackSearchParams = useCallback(() => {
        const maxDistance = STORE_LOCATOR_DISTANCE * 500
        
        return {
            latitude: DEFAULT_STORE_LOCATOR_COUNTRY.latitude || 0,
            longitude: DEFAULT_STORE_LOCATOR_COUNTRY.longitude || 0,
            locale: intl.locale,
            maxDistance,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        }
    }, [intl.locale])

    const {
        data: fallbackStoresData,
        isLoading: isLoadingFallbackStores
    } = useSearchStores({
        parameters: getFallbackSearchParams(),
        enabled: needsFallbackSearch
    })

    const combinedStoresData = allStoresData?.data?.length ? allStoresData : fallbackStoresData
    const getCityCoordinatesFromStores = useCallback((cityName, countryCode) => {
        const stores = combinedStoresData?.data || []
        if (stores.length === 0) return null

        const cityKey = cityName.toLowerCase().trim()
        const defaultCountry = countryCode || DEFAULT_STORE_LOCATOR_COUNTRY.countryCode
        

        let cityStores = stores.filter(store => {
            const storeCity = (store.city || '').toLowerCase().trim()
            const storeCountry = store.countryCode || DEFAULT_STORE_LOCATOR_COUNTRY.countryCode
            const cityMatch = storeCity === cityKey || 
                             storeCity.includes(cityKey) || 
                             cityKey.includes(storeCity)
            
            return cityMatch && storeCountry === defaultCountry && store.latitude && store.longitude
        })


        if (cityStores.length === 0) {
            cityStores = stores.filter(store => {
                const storeCity = (store.city || '').toLowerCase().trim()
                const cityMatch = storeCity === cityKey || 
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
    }, [combinedStoresData])

    const cityCoords = useMemo(() => {
        if (!locationData?.city || isLoadingAllStores) return null
        return getCityCoordinatesFromStores(locationData.city, locationData?.countryCode)
    }, [locationData?.city, locationData?.countryCode, getCityCoordinatesFromStores, isLoadingAllStores])

    // City coordinate search
    const {
        data: cityStoreData,
        isLoading: isLoadingCityStores
    } = useSearchStores({
        parameters: {
            latitude: cityCoords?.lat,
            longitude: cityCoords?.lng,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE * 5,
            limit: 200,
            distanceUnit: STORE_LOCATOR_DISTANCE_UNIT
        },
        enabled: Boolean(cityCoords && locationData?.city && !locationData?.latitude && !locationData?.zipcode && !isLoadingAllStores)
    })

    useEffect(() => {
        setEnableCoordinateSearch(Boolean(locationData?.latitude && locationData?.longitude))
    }, [locationData?.latitude, locationData?.longitude])

    const getStoreSearchData = () => {
        if (coordinateStoreData) return coordinateStoreData
        if (postalCodeStoreData) return postalCodeStoreData
        if (storeNameLocationData) return storeNameLocationData
        if (cityStoreData) return cityStoreData
        if (locationData?.storeName && locationData?.countryCode && !locationData?.zipcode && !locationData?.city && combinedStoresData) {
            return combinedStoresData
        }
        return null
    }

    const storeSearchData = getStoreSearchData()
    const isLoadingStores = isLoadingCoordinateStores || isLoadingPostalStores || isLoadingStoreNameLocation || isLoadingCityStores || isLoadingAllStores || isLoadingFallbackStores

    const findMatchingStore = useCallback((stores, searchCriteria) => {
        if (!stores || stores.length === 0) return null

        const { storeName, zipcode, city, countryCode } = searchCriteria
        const defaultCountry = countryCode || DEFAULT_STORE_LOCATOR_COUNTRY.countryCode

        if (storeName) {
            const searchNameLower = storeName.toLowerCase().trim()
            let exactMatches = stores.filter(store => {
                const storeNameLower = (store.name || '').toLowerCase().trim()
                return storeNameLower === searchNameLower
            })

            if (exactMatches.length > 0) {
                let nameMatches = exactMatches
                if (countryCode && nameMatches.length > 0) {
                    const countryFilteredMatches = nameMatches.filter(store => 
                        (store.countryCode || DEFAULT_STORE_LOCATOR_COUNTRY.countryCode) === countryCode
                    )
                    if (countryFilteredMatches.length > 0) {
                        nameMatches = countryFilteredMatches
                    }
                }


                if (zipcode && nameMatches.length > 0) {
                    const zipFilteredMatches = nameMatches.filter(store => {
                        const storeZip = store.postalCode || store.address?.postalCode
                        return storeZip === zipcode
                    })
                    if (zipFilteredMatches.length > 0) {
                        nameMatches = zipFilteredMatches
                    }
                }


                if (city && nameMatches.length > 0) {
                    const cityFilteredMatches = nameMatches.filter(store => {
                        const storeCity = (store.city || store.address?.city || '').toLowerCase()
                        return storeCity.includes(city.toLowerCase())
                    })
                    if (cityFilteredMatches.length > 0) {
                        nameMatches = cityFilteredMatches
                    }
                }

                if (nameMatches.length > 0) return nameMatches[0]
            }
            

            let nameMatches = stores.filter(store => {
                const storeNameLower = (store.name || '').toLowerCase().trim()
                return storeNameLower.includes(searchNameLower) || searchNameLower.includes(storeNameLower)
            })


            if (countryCode && nameMatches.length > 0) {
                const countryFilteredMatches = nameMatches.filter(store => 
                    (store.countryCode || DEFAULT_STORE_LOCATOR_COUNTRY.countryCode) === countryCode
                )
                if (countryFilteredMatches.length > 0) {
                    nameMatches = countryFilteredMatches
                }
            }


            if (zipcode && nameMatches.length > 0) {
                const zipFilteredMatches = nameMatches.filter(store => {
                    const storeZip = store.postalCode || store.address?.postalCode
                    return storeZip === zipcode
                })
                if (zipFilteredMatches.length > 0) {
                    nameMatches = zipFilteredMatches
                }
            }


            if (city && nameMatches.length > 0) {
                const cityFilteredMatches = nameMatches.filter(store => {
                    const storeCity = (store.city || store.address?.city || '').toLowerCase()
                    return storeCity.includes(city.toLowerCase())
                })
                if (cityFilteredMatches.length > 0) {
                    nameMatches = cityFilteredMatches
                }
            }

            if (nameMatches.length > 0) return nameMatches[0]
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

        return stores.length > 0 ? stores[0] : null
    }, [])


    useEffect(() => {
        if (storeSearchData?.data && locationData && isProcessing) {
            const countryCode = getCountryForPostalSearch(locationData.zipcode, locationData.countryCode)
            const searchCriteria = {
                ...locationData,
                countryCode: locationData.countryCode || countryCode
            }
            const selectedStore = findMatchingStore(storeSearchData.data, searchCriteria) || storeSearchData.data[0]
            
            if (selectedStore) {
                window.localStorage.setItem(storeInfoKey, JSON.stringify({
                    id: selectedStore.id,
                    name: selectedStore.name || null,
                    inventoryId: selectedStore.inventoryId || null
                }))
                
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
                
                window.dispatchEvent(new CustomEvent('gmbStoreSelected', {
                    detail: {
                        store: selectedStore,
                        source: 'google_my_business',
                        hasStoreName: Boolean(locationData.storeName),
                        selectionMethod: locationData.storeName ? 'name_match' : 'nearest_location',
                        countryCode: countryCode
                    }
                }))
            }
            
            setIsProcessing(false)
        }
    }, [storeSearchData, locationData, isProcessing, findMatchingStore, storeInfoKey, getCountryForPostalSearch, cityCoords])

    const processGMBParameters = useCallback((urlParams) => {
        const hasGMBParams = urlParams.has('lat') || urlParams.has('lng') || urlParams.has('zip') || 
                           urlParams.has('zipcode') || urlParams.has('postal') || urlParams.has('city') || 
                           urlParams.has('store') || urlParams.has('country')

        if (!hasGMBParams) return

        const lat = urlParams.get('lat') || urlParams.get('latitude')
        const lng = urlParams.get('lng') || urlParams.get('longitude') || urlParams.get('lon')
        const storeName = urlParams.get('store') || urlParams.get('storeName') || urlParams.get('name')
        const zipcode = urlParams.get('zip') || urlParams.get('zipcode') || urlParams.get('postal')
        const city = urlParams.get('city') || urlParams.get('location')
        const country = urlParams.get('country') || urlParams.get('countryCode') || urlParams.get('cc')
        const coords = urlParams.get('coords')
        const address = urlParams.get('address')

        let parsedLat = null, parsedLng = null

        if (lat && lng) {
            parsedLat = parseFloat(lat)
            parsedLng = parseFloat(lng)
        } else if (coords) {
            const [coordLat, coordLng] = coords.split(',').map(c => parseFloat(c.trim()))
            if (!isNaN(coordLat) && !isNaN(coordLng)) {
                parsedLat = coordLat
                parsedLng = coordLng
            }
        }

        let parsedCity = city
        if (!parsedCity && address) {
            const addressParts = address.split(',')
            if (addressParts.length >= 2) {
                parsedCity = addressParts[addressParts.length - 2].trim()
            }
        }

        const hasLocationData = !!(parsedLat && parsedLng)
        const hasIdentifierData = !!(storeName || zipcode || parsedCity)

        if (hasLocationData || hasIdentifierData) {
            const finalCountryCode = country || getCountryForPostalSearch(zipcode, null)

            setIsProcessing(true)
            setLocationData({
                latitude: parsedLat,
                longitude: parsedLng,
                storeName,
                zipcode,
                city: parsedCity,
                countryCode: finalCountryCode
            })
        }
    }, [getCountryForPostalSearch])

    return {
        isProcessing: isProcessing || isLoadingStores,
        shouldOpenModal,
        setShouldOpenModal,
        storeLocatorParams,
        processGMBParameters
    }
}

export default useGMBStoreSelection 