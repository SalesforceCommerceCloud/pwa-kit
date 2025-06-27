/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import useEinstein from '../../hooks/use-einstein'
import useDataCloud from '../../hooks/use-datacloud'
import useActiveData from '../../hooks/use-active-data'
import logger from '../../utils/logger-instance'

export const useProductDetailAnalytics = (product, category) => {
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()

    useEffect(() => {
        if (product && product.type.set) {
            einstein.sendViewProduct(product)
            dataCloud.sendViewProduct(product)
            const childrenProducts = product.setProducts
            childrenProducts.map((child) => {
                try {
                    einstein.sendViewProduct(child)
                } catch (err) {
                    logger.error('Einstein sendViewProduct error', {
                        namespace: 'useProductAnalytics.useEffect',
                        additionalProperties: {error: err, child}
                    })
                }
                activeData.sendViewProduct(category, child, 'detail')
                dataCloud.sendViewProduct(child)
            })
        } else if (product) {
            try {
                einstein.sendViewProduct(product)
            } catch (err) {
                logger.error('Einstein sendViewProduct error', {
                    namespace: 'useProductAnalytics.useEffect',
                    additionalProperties: {error: err, product}
                })
            }
            activeData.sendViewProduct(category, product, 'detail')
            dataCloud.sendViewProduct(product)
        }
    }, [product, category])
}
