/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import {FormattedMessage} from 'react-intl'
import {Flex, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    AmexIcon,
    DiscoverIcon,
    LockIcon,
    MastercardIcon,
    VisaIcon
} from '@salesforce/retail-react-app/app/components/icons'
import Link from '@salesforce/retail-react-app/app/components/link'
import SFPaymentsExpress from '@salesforce/retail-react-app/app/components/sf-payments-express'
import {useShopperConfiguration} from '@salesforce/retail-react-app/app/hooks/use-shopper-configuration'

const CartCta = () => {
    const sfPaymentsEnabled = useShopperConfiguration('SalesforcePaymentsAllowed') === true

    return (
        <Fragment>
            <Button
                as={Link}
                to="/checkout"
                width={['95%', '95%', '95%', '100%']}
                marginTop={[6, 6, 2, 2]}
                mb={sfPaymentsEnabled ? 2 : 4}
                rightIcon={<LockIcon />}
                variant="solid"
            >
                <FormattedMessage
                    defaultMessage="Proceed to Checkout"
                    id="cart_cta.link.checkout"
                />
            </Button>
            {sfPaymentsEnabled ? (
                <SFPaymentsExpress expressButtonLayout="vertical" maximumButtonCount={4} />
            ) : (
                <Flex justify={'center'}>
                    <VisaIcon height={8} width={10} mr={2} />
                    <MastercardIcon height={8} width={10} mr={2} />
                    <AmexIcon height={8} width={10} mr={2} />
                    <DiscoverIcon height={8} width={10} mr={2} />
                </Flex>
            )}
        </Fragment>
    )
}

export default CartCta
