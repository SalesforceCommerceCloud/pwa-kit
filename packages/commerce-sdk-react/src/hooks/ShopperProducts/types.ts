import {QueryParams} from '../../types'

interface ShopperProductParams extends QueryParams {
    id: string | undefined
    inventoryIds: string | undefined
    allImages: boolean
    perPricebook: boolean
}

type ShopperProductsParams = Omit<ShopperProductParams, 'id'> & {
    ids: string[] | undefined
}

interface ShopperCategoryParams extends QueryParams {
    id: string | undefined
    levels: number | undefined
}

type ShopperCategoriesParams = Omit<ShopperProductParams, 'id'> & {
    ids: string[] | undefined
}

export type {
    ShopperProductParams,
    ShopperProductsParams,
    ShopperCategoryParams,
    ShopperCategoriesParams,
}
