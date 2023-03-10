/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import {useCommerceAPI} from '../contexts'

/**
 * Hook for retrieving and managing state of Search Suggestions
 */
const useSearchSuggestions = () => {
    const api = useCommerceAPI()
    const [state, setState] = useState({results: {}})
    return {
        ...state,
        /**
         * Retrieves search suggestions from api based on input
         *
         * @param {input} string
         */
        async getSearchSuggestions(input) {
            setState({loading: true})
            const searchSuggestions = await api.shopperSearch.getSearchSuggestions({
                parameters: {
                    q: input
                }
            })
            setState({results: searchSuggestions})
        },
        /**
         * Clears results
         */
        async clearSuggestedSearch() {
            setState({results: {}})
        }
    }
}

export default useSearchSuggestions
