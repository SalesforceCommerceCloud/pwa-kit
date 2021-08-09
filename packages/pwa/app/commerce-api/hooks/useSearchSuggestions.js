/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {useState} from 'react'
import {useCommerceAPI} from '../utils'

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
