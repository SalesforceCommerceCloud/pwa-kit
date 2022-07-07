import {QueryParams} from '../../types'

interface CommonSearchParams {
    q: string | undefined
    limit: number | undefined
}

interface ShopperSearchProductParams extends QueryParams, CommonSearchParams {
    refine: string | undefined
    sort: string | undefined
    offset: number | undefined
}

type ShopperSearchSuggestionsParams = QueryParams & CommonSearchParams

export type {ShopperSearchProductParams, ShopperSearchSuggestionsParams}
