import useSWR from 'swr'
import {ShopperSearch} from 'commerce-sdk-isomorphic'
import config from '../commerce-api-config'
import {getAccessToken} from '../auth'

const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s))

const getProductSearch = async (searchTerm) => {
    const accessToken = await getAccessToken()

    const api = new ShopperSearch({
        ...config,
        headers: {authorization: `Bearer ${accessToken}`},
    })

    await sleep(1)

    const result = await api.productSearch({
        parameters: {q: searchTerm, limit: 20},
    })

    return result
}

const useProductSearch = ({searchTerm}) => {
    const result = useSWR(searchTerm, getProductSearch)

    return result
}

export default useProductSearch
