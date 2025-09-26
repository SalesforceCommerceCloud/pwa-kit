/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

const BonusProductsTitle = ({bonusItemsCount = 0}) => {
    return (
        <Box layerStyle="cardBordered" p={3}>
            <Text fontWeight="bold">
                <FormattedMessage
                    defaultMessage="Bonus Products ({itemCount, plural, =0 {0 items} one {# item} other {# items}})"
                    values={{itemCount: bonusItemsCount}}
                    id="bonus_products_title.title.num_of_items"
                />
            </Text>
        </Box>
    )
}

BonusProductsTitle.propTypes = {
    bonusItemsCount: PropTypes.number
}

export default BonusProductsTitle
