/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useState} from 'react'
import {useIntl} from 'react-intl'
import {AmplienceContext} from '../../contexts/amplience'
import {useCommerceAPI} from '../contexts'

/**
 * Hook for retrieving and managing state of Search Suggestions
 */
const useSearchSuggestions = () => {
    const api = useCommerceAPI()
    const {client} = useContext(AmplienceContext)
    const [state, setState] = useState({results: {}})
    const {locale} = useIntl()
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
                    q: input,
                    limit: 6
                }
            })
            const filteredSearchablePages = await client.getSearchableContentPages(locale, input)
            searchSuggestions.pageSuggestions = filteredSearchablePages.slice(0, 4)
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
