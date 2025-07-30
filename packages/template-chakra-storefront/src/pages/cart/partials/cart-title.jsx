/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import {useIntl} from 'react-intl'
import {Heading} from '@chakra-ui/react'
import {useCurrentBasket} from '../../../hooks/use-current-basket'

const CartTitle = () => {
    const intl = useIntl()
    const {formatMessage} = intl
    const {
        derivedData: {totalItems}
    } = useCurrentBasket()

    const messages = useMemo(
        () => ({
            title: intl.formatMessage(
                {
                    id: 'cart_title.title.cart_num_of_items',
                    defaultMessage:
                        'Cart ({itemCount, plural, =0 {0 items} one {# item} other {# items}})'
                },
                {itemCount: totalItems}
            )
        }),
        [intl, totalItems]
    )

    return (
        <Heading as="h1" fontSize={['xl', 'xl', 'xl', '2xl']}>
            {messages.title}
        </Heading>
    )
}

export default CartTitle
