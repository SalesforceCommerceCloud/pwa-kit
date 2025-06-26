import {HOME_SHOP_PRODUCTS_LIMIT} from '@salesforce/retail-react-app/app/constants'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

export const useBonusProductSearch = (promotionId) => {
    const {data: productSearchResult} = useProductSearch({
        parameters: {
            allImages: true,
            allVariationProperties: true,
            expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
            limit: HOME_SHOP_PRODUCTS_LIMIT,
            perPricebook: true,
            refine: [`pmid=${promotionId}`, 'htype=master']
        }
    })
    return {
        data: productSearchResult
    }
}