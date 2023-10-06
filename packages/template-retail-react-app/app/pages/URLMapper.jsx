import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {useLocation} from 'react-router-dom'
import fetch from 'cross-fetch'
import loadable from '@loadable/component'
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'

const fallback = <Skeleton height="75vh" width="100%" />

//Pages
const ProductList = loadable(() => import('./product-list'), {
    fallback
})

const URLMapper = () => {
    const {pathname} = useLocation()
    const {data} = useQuery({

        queryKey: [pathname],
        queryFn: async () => {
            const response = await fetch(`https://26a13fd6-7ea4-40b7-b462-db4dd988e451.mock.pstmn.io/url-mapping?urlSegment=${pathname}`)
            return response.json()
        },
    })

    if (data.resourceType == 'CATEGORY') {
        return (
        <ProductList />)
    }
}


export default URLMapper