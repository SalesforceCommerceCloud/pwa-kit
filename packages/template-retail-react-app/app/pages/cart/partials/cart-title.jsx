/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

const CartTitle = () => {
    const {
        derivedData: {totalItems}
    } = useCurrentBasket()
    return (
        <Text fontWeight="bold" fontSize={['xl', 'xl', 'xl', '2xl']}>
            <FormattedMessage
                defaultMessage="Cart ({itemCount, plural, =0 {0 items} one {# item} other {# items}})"
                values={{itemCount: totalItems}}
                id="cart_title.title.cart_num_of_items"
            />
        </Text>
    )
}

export default CartTitle
