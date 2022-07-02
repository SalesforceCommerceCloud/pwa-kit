import useSWR from 'swr'
import {ShopperSearch} from 'commerce-sdk-isomorphic'
import config from '../commerce-api-config'
import {useServerEffect} from '../provider'
import {getAccessToken} from '../auth'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isServer = typeof window === 'undefined'

const getProductSearch = async (searchTerm) => {
    const accessToken = await getAccessToken()

    const api = new ShopperSearch({
        ...config,
        headers: {authorization: `Bearer ${accessToken}`},
    })

    await sleep(2000)

    const result = await api.productSearch({
        parameters: {q: searchTerm, limit: 20},
    })

    return result
}

const useProductSearch = ({searchTerm}, source: []) => {
    if (isServer) {
        const {data, isLoading, error} = useServerEffect(
            async () => {
                const data = await getProductSearch(searchTerm)
                return data
            },
            source,
            searchTerm
        )
        return {data, error, isLoading}
    }
    const {data, error, isValidating} = useSWR(searchTerm, getProductSearch)
    return {data, error, isLoading: isValidating}
}

export default useProductSearch
