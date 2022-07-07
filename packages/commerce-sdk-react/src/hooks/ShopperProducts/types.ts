import {QueryParams} from '../../types'

interface ShopperProductParams extends QueryParams {
    id: string | undefined
    inventoryIds: string | undefined
    allImages: boolean
    perPricebook: boolean
}

export type {ShopperProductParams}
