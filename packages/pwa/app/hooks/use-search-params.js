/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {useLocation} from 'react-router-dom'

// Constants
import {DEFAULT_SEARCH_PARAMS} from '../constants'

/*
 * This hook will return all the location search params pertinant
 * to the product list page.
 */
export const useSearchParams = (searchParams = DEFAULT_SEARCH_PARAMS) => {
    const {search} = useLocation()
    const params = new URLSearchParams(search)

    return Object.keys(searchParams).reduce((acc, key) => {
        let value = params.get(`${key}`) || searchParams[key]

        if (!isNaN(value)) {
            value = parseInt(value)
        }

        return {...acc, [key]: value}
    }, {})
}
