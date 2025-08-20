import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'

export type FilterValue = NonNullable<ShopperSearchTypes.ProductSearchRefinement['values']>[0]
