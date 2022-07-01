import useSWR from 'swr'
import {ShopperSearch} from 'commerce-sdk-isomorphic'
import config from '../commerce-api-config'
import {getAccessToken} from '../auth'

// const authMiddleware = (useSWRNext) => {
//     return async (key, fetcher, config) => {
//         if (!tokens.access_token) {
//             await getAccessToken()
//         }
//         const swr = useSWRNext(key, fetcher, config)
//         return swr
//     }
// }

const useProductSearch = () => {
    const result = useSWR('shirt', async () => {
        const accessToken = await getAccessToken()

        const api = new ShopperSearch({
            ...config,
            headers: {authorization: `Bearer ${accessToken}`},
        })

        const result = await api.productSearch({
            parameters: {q: 'shirt'},
        })

        return result
    })

    return result
}

export default useProductSearch
