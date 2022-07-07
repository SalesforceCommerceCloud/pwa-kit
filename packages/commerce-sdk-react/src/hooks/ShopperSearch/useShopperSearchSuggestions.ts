import {SuggestionResult} from 'commerce-sdk-isomorphic'
import {ShopperSearchSuggestionsParams} from './types'
import {QueryResponse} from '../../types'

const useShopperSearchSuggestions = (
    params: ShopperSearchSuggestionsParams,
    source: []
): QueryResponse<SuggestionResult> => {
    return {
        data: {},
        isLoading: true,
        error: undefined,
    }
}

export default useShopperSearchSuggestions
