/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import {useIntl} from 'react-intl'
import {Flex, Button} from '@chakra-ui/react'
import {AmexIcon, DiscoverIcon, LockIcon, MastercardIcon, VisaIcon} from '../../../components/icons'
import Link from '../../../components/link'

const CartCta = () => {
    const {formatMessage} = useIntl()

    const messages = {
        checkout: formatMessage({
            id: "cart_cta.link.checkout",
            defaultMessage: "Proceed to Checkout"
        })
    }

    return (
        <Fragment>
            <Button asChild>
                <Link
                    to="/checkout"
                    width={['95%', '95%', '95%', '100%']}
                    marginTop={[6, 6, 2, 2]}
                    mb={4}
                    variant="solid"
                >
                    {messages.checkout}
                    <LockIcon />
                </Link>
            </Button>
            <Flex justifyContent="center">
                <VisaIcon height={8} width={10} mr={2} />
                <MastercardIcon height={8} width={10} mr={2} />
                <AmexIcon height={8} width={10} mr={2} />
                <DiscoverIcon height={8} width={10} mr={2} />
            </Flex>
        </Fragment>
    )
}

export default CartCta
