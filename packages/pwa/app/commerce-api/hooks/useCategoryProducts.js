/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import {useCommerceAPI} from '../contexts'

const useCategoryProducts = () => {
    const api = useCommerceAPI()
    const [state, setState] = useState({
        loading: false,
        products: undefined
    })

    return {
        ...state,

        api: api.shopperProducts.getCategory,

        async getCategoryProducts(categoryId, limit) {
            setState((s) => ({...s, loading: true}))

            const products = await api.shopperSearch.productSearch({
                parameters: {
                    refine: [`cgid=${categoryId}`, 'htype=master'],
                    limit: limit
                }
            })

            setState({loading: false, products})
        }
    }
}

export default useCategoryProducts
