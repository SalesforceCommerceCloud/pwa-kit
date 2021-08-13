/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Object that is used for creating search urls
const filterMap = {
    prefn1: 'prefv1',
    prefn2: 'prefv2',
    prefn3: 'prefv3',
    prefn4: 'prefv4',
    prefn5: 'prefv5',
    prefn6: 'prefv6',
    prefn7: 'prefv7',
    prefn8: 'prefv8',
    prefn9: 'prefv9'
}

/**
 * Takes url query params as a string or object and a categoryId and returns a
 * search params object that can be passed directly to `productStore.search`.
 *
 * @param {Object || string} queryParams
 * @param {string} categoryId
 * @returns {boolean}
 */
export function queryToProductSearch(queryParams, categoryId) {
    // if given a string for queryParams convert it to <key, val> object
    if (typeof queryParams === 'string') {
        queryParams = parseQueryString(queryParams)
    }

    let limit = 24
    let refine = []
    let sort
    let q
    let offset = 0

    if (queryParams) {
        refine = Object.keys(queryParams)
            .map((key) => {
                if (key.includes('prefn')) {
                    return {
                        id: queryParams[key],
                        value: queryParams[filterMap[key]]
                    }
                }
            })
            .filter((i) => i)
            .reduce((acc, filter) => {
                return [...acc, `${filter.id}=${filter.value}`]
            }, [])
        sort = queryParams.sort || 'best-matches'
        q = queryParams.q
        offset = queryParams.offset || offset
        limit = queryParams.limit || limit
    }

    if (!refine.includes(`cgid=${categoryId}`) && categoryId) {
        refine.push(`cgid=${categoryId}`)
    }

    // only search master products
    refine.push('htype=master')

    const searchParams = {
        refine,
        ...(q && {q}),
        ...(sort && {sort}),
        limit,
        offset: offset
    }

    return searchParams
}

/**
 * Adds a filter to the search url which can be digested by queryToProductSearch function
 *
 * @param {string} location
 * @param {array} newFilters
 * @param {array} asObject
 * @returns {string || Object} // depending on asObject arguemnt
 */
export const addFilterToSearch = (location, newFilters, asObject) => {
    let currentParams = parseQueryString(location.search)
    let filterCount = 0
    for (let index = 1; index < 10; index++) {
        if (`prefn${index}` in currentParams) {
            filterCount++
        }
    }

    const updatedParams = Object.assign(
        ...newFilters.map((filter) => {
            // Check if filter already exists, if so append to current filter with a `|`
            const existingFilter = getKeyByValue(currentParams, filter.id)
            if (existingFilter) {
                // Check for price as this filter can only have one value selected
                if (currentParams[existingFilter] === 'price') {
                    currentParams[filterMap[existingFilter]] = filter.value
                    return {}
                } else {
                    currentParams[filterMap[existingFilter]] = `${
                        currentParams[filterMap[existingFilter]]
                    }|${filter.value}`

                    return {}
                }
            } else {
                const id = `prefn${filterCount + 1}`
                const value = `prefv${filterCount + 1}`
                filterCount++
                currentParams = Object.assign(
                    {[id]: filter.id, [value]: filter.value},
                    currentParams
                )
                return {
                    [id]: filter.id,
                    [value]: filter.value
                }
            }
        }),
        currentParams
    )

    if (asObject) {
        return updatedParams
    }

    const query = new URLSearchParams(updatedParams)

    return query.toString()
}

/**
 * Removes a filter from the search url which can be digested by queryToProductSearch function
 *
 * @param {string} location
 * @param {array} filtersToRemove
 * @returns {string}
 */
export function removeFilterFromSearch(location, filtersToRemove) {
    let currentParams = parseQueryString(location.search)

    filtersToRemove.map((filter) => {
        const filterKey = getKeyByValue(currentParams, filter.id)
        let pipeBefore = false
        if (currentParams[filterMap[filterKey]]?.includes('|')) {
            if (currentParams[filterMap[filterKey]].indexOf(filter.value) > 0) {
                pipeBefore = true
            }
            const replacedParam = pipeBefore ? `|${filter.value}` : `${filter.value}|`

            currentParams[filterMap[filterKey]] = currentParams[filterMap[filterKey]].replace(
                replacedParam,
                ''
            )
        } else {
            delete currentParams[filterKey]
            delete currentParams[filterMap[filterKey]]
        }
    })

    // check for a sort
    let sortInPlace = false
    let sort = {}
    if (currentParams.srule) {
        sortInPlace = true
        sort = {sort: currentParams.sort}
    }
    // check for q
    let queryInPlace = false
    let query = {}
    if (currentParams.q) {
        queryInPlace = true
        query = {q: currentParams.q}
    }

    currentParams = transformFilterFromUrl(currentParams)
    currentParams = addFilterToSearch({...location, search: {}}, currentParams, true)
    if (sortInPlace) {
        currentParams = {...currentParams, ...sort}
    }
    if (queryInPlace) {
        currentParams = {...currentParams, ...query}
    }

    const qParams = new URLSearchParams(currentParams)
    return qParams.toString()
}

function getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value)
}

export function parseQueryString(qs) {
    const searchParams = new URLSearchParams(qs)
    const queryParams = {}
    for (var pair of searchParams.entries()) {
        queryParams[pair[0]] = pair[1]
    }
    return queryParams
}

function transformFilterFromUrl(currentParams) {
    const formattedFilters = []
    Object.keys(currentParams).forEach((key) => {
        if (key.includes('prefn')) {
            formattedFilters.push({
                id: currentParams[key],
                value: currentParams[filterMap[key]]
            })
        }
    })

    return formattedFilters
}

export function toggleSelectedFilter(refinement, attributeId, selected) {
    if (!selected) {
        return addFilterToSearch(window.location, [{id: attributeId, value: refinement.value}])
    } else {
        return removeFilterFromSearch(window.location, [{id: attributeId, value: refinement.value}])
    }
}
