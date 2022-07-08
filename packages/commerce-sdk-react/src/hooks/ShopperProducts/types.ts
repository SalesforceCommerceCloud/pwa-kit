import {QueryParams} from '../../types'

interface ShopperProductParams extends QueryParams {
    id?: string
    inventoryIds?: string
    allImages?: boolean
    perPricebook?: boolean
}

type ShopperProductsParams = Omit<ShopperProductParams, 'id'> & {
    ids?: string[]
}

interface ShopperCategoryParams extends QueryParams {
    id?: string
    levels?: number
}

type ShopperCategoriesParams = Omit<ShopperProductParams, 'id'> & {
    ids?: string[]
}

export type {
    ShopperProductParams,
    ShopperProductsParams,
    ShopperCategoryParams,
    ShopperCategoriesParams,
}
