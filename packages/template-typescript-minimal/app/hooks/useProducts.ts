import useSWR, {useSWRConfig} from 'swr'
import {ShopperProducts} from 'commerce-sdk-isomorphic'
import config from '../commerce-api-config'
import {getAccessToken} from '../auth'

const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s))

const getProducts = async (productIds: string) => {
    const accessToken = await getAccessToken()

    const api = new ShopperProducts({
        ...config,
        headers: {authorization: `Bearer ${accessToken}`},
    })

    await sleep(1)

    const result = await api.getProducts({
        parameters: {ids: productIds},
    })

    return result
}

const useProducts = ({productIds}: {productIds: string[] | undefined}) => {
    const key = productIds?.join(',')
    const result = useSWR(key, getProducts)
    const {mutate} = useSWRConfig()

    // Q: How do we do instant page reloading when PLP and PDP calls different APIs?

    // This is where we make instant page loading happens
    // when a call was made to /products/?ids=12328M,373829M,...
    // 1. We cache the response under the cache key:
    //    hash({productIds:[12328M,373829M]})
    // 2. Annnnnnnnnnd, we also cache the individual product detail
    //    hash({productId: 12328M})
    //    hash({productId: 373829M})
    //    This will populate the cache for individual useProduct(id) calls
    //    and when user navigates to the PDP, the cache is already populated!

    if (productIds?.length && result.data) {
        productIds.forEach((productId) => {
            mutate(productId, () => {
                const productData = result.data?.data.find((product) => product.id === productId)
                return productData
            })
        })
    }

    return result
}

export default useProducts
