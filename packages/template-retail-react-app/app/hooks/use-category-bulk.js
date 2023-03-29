/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCommerceApi, useAccessToken} from 'commerce-sdk-react-preview'
import {useQueries} from '@tanstack/react-query'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import useMultiSite from './use-multi-site'

/**
 * a hook that parallelly and individually fetches category based on the given ids
 * @param ids - list of categories ids to fetch
 * @param queryOptions -  react query options
 * @return list of react query results
 */
export const useCategoryBulk = (ids, queryOptions) => {
    if (!ids || ids.length === 0) {
        return
    }
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()
    const {
        app: {commerceAPI}
    } = getConfig()
    const {
        parameters: {organizationId}
    } = commerceAPI
    const {site} = useMultiSite()

    const queries = ids.map((id) => {
        return {
            queryKey: [
                '/organizations/',
                organizationId,
                '/categories/',
                id,
                {id, levels: 2, organizationId, siteId: site.id}
            ],
            queryFn: async () => {
                const token = await getTokenWhenReady()
                const res = await api.shopperProducts.getCategory({
                    parameters: {id, levels: 2},
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                })
                return res
            },
            ...queryOptions
        }
    })
    const res = useQueries({queries})
    return res
}
