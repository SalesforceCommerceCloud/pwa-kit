/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

const BonusProductsTitle = () => {
    const {data: basket} = useCurrentBasket()
    const bonusItemsCount =
        basket?.productItems?.filter((item) => item.bonusProductLineItem)?.length || 0

    return (
        <Heading as="h2" fontSize="xl">
            <FormattedMessage
                defaultMessage="Bonus Products ({itemCount, plural, =0 {0 items} one {# item} other {# items}})"
                values={{itemCount: bonusItemsCount}}
                id="bonus_products_title.title.num_of_items"
            />
        </Heading>
    )
}

export default BonusProductsTitle
