import useSWR from 'swr'
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

    return result
}

export default useProducts
