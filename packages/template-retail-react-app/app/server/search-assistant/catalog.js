/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {productFact} from '../catalog-facts'

const MAX_PRODUCTS = 100
export async function expandCatalogFacts({entry, authorization, signal, config, fetchImpl}) {
    if (entry.details) return
    const url = new URL(entry.searchUrl)
    url.searchParams.set('limit', String(MAX_PRODUCTS))
    url.searchParams.set('offset', '0')
    const headers = {Authorization: authorization}
    const search = await fetchImpl(url, {headers, signal, redirect: 'error'})
    if (!search.ok) {
        const error = new Error('Catalog details unavailable')
        error.status = search.status
        throw error
    }
    const result = await search.json()
    entry.total = result.total ?? entry.total
    const hits = (result.hits || []).slice(0, MAX_PRODUCTS)
    // Scope answers to the first bounded set of matches in the original query and filters.
    entry.products = new Map(
        hits.map((hit) => {
            const fact = productFact(hit)
            return [fact.id, fact]
        })
    )
    const ids = [...entry.products.keys()]
    const host = config.ssrParameters.proxyConfigs.find((p) => p.path === 'api').host
    const org = config.app.commerceAPI.parameters.organizationId
    let detailed = 0
    for (let start = 0; start < ids.length; start += 48) {
        const batches = [ids.slice(start, start + 24), ids.slice(start + 24, start + 48)].filter(
            (batch) => batch.length
        )
        await Promise.all(
            batches.map(async (batch) => {
                const endpoint = new URL(
                    `https://${host}/product/shopper-products/v1/organizations/${org}/products`
                )
                endpoint.search = new URLSearchParams({
                    ids: batch.join(','),
                    siteId: entry.parameters.siteId,
                    locale: entry.parameters.locale,
                    currency: entry.parameters.currency,
                    expand: 'images,prices,variations'
                })
                const response = await fetchImpl(endpoint, {headers, signal, redirect: 'error'})
                if (!response.ok) return
                const body = await response.json()
                for (const product of body.data || []) {
                    const id = String(product.id)
                    if (!entry.products.has(id)) continue
                    entry.products.set(id, productFact(product, entry.products.get(id)))
                    detailed++
                }
            })
        )
    }
    entry.details = true
    entry.detailed = detailed
}

export const modelProducts = (entry) =>
    [...entry.products.values()].map(({id, name, price, description, attributes}) => ({
        id,
        name,
        price,
        description,
        attributes
    }))
