/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '../../hooks/use-einstein'
import useDataCloud from '../../hooks/use-datacloud'
import useActiveData from '../../hooks/use-active-data'
import logger from '../../utils/logger-instance'

const PageAnalytics = ({product, category}) => {
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()
    console.log('page analytics')
    console.log(product)
    console.log(category)

    useEffect(() => {
        console.log('useEffect')
        if (!product || !category) {
            return
        }
        console.log('send analytics')
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
    }, [product?.id, category?.id])

    return null
}

PageAnalytics.propTypes = {
    product: PropTypes.object,
    category: PropTypes.object
}

export default PageAnalytics
