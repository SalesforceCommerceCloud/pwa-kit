/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useStyleConfig, Box, Badge} from '@salesforce/retail-react-app/app/components/shared/ui'
import {PRODUCT_TILE_BADGE_LABELS} from '@salesforce/retail-react-app/app/constants'

const BadgeGroup = (props) => {
    const {badgeLabels = PRODUCT_TILE_BADGE_LABELS, product} = props
    const styles = useStyleConfig('BadgeGroup')

    //TODO: check for duplicate labels
    // If product is not provided/undefined then render the provided badge labels. This is useful if user already has the logic to get the badge labels outside the badge group
    let filteredLabels = badgeLabels
    if (product) {
        // validate the provided badge labels against the product custom properties. This will allow users to use any boolean custom properties as badges
        filteredLabels = badgeLabels.filter((item) => {
            const propertyName = `c_is${item.label}`
            return typeof product[propertyName] === 'boolean' && product[propertyName] === true
        })
    }
    return (
        filteredLabels?.length > 0 && (
            <Box {...styles.badgeGroup}>
                {filteredLabels.map(({label, color}) => {
                    return (
                        <Badge {...styles.badge} key={label} colorScheme={color}>
                            {label}
                        </Badge>
                    )
                })}
            </Box>
        )
    )
}

BadgeGroup.displayName = 'BadgeGroup'

BadgeGroup.propTypes = {
    displayName: PropTypes.string,
    /**
     * The badge label details
     */
    badgeLabels: PropTypes.array,
    /**
     * The product with badge values/custom properties
     */
    product: PropTypes.object
}
export default BadgeGroup
