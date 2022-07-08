import {QueryParams} from '../../types'

interface CommonSearchParams {
    q?: string | undefined
    limit?: number | undefined
}

interface ShopperSearchProductParams extends QueryParams, CommonSearchParams {
    refine?: string
    sort?: string
    offset?: number
}

type ShopperSearchSuggestionsParams = QueryParams & CommonSearchParams

export type {ShopperSearchProductParams, ShopperSearchSuggestionsParams}
