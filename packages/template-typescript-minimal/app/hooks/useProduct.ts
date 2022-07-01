import useSWR from 'swr'
import {ShopperProducts} from 'commerce-sdk-isomorphic'
import config from '../commerce-api-config'
import {getAccessToken} from '../auth'

const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s))

const getProduct = async (productId: string) => {
    const accessToken = await getAccessToken()

    const api = new ShopperProducts({
        ...config,
        headers: {authorization: `Bearer ${accessToken}`},
    })

    await sleep(1)

    const result = await api.getProduct({
        parameters: {id: productId},
    })

    return result
}

const useProduct = ({productId}: {productId: string | undefined}) => {
    const result = useSWR(productId, getProduct)

    return result
}

export default useProduct
