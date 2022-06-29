/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import CheckoutHeader from '../../pages/checkout/partials/checkout-header'
import CheckoutFooter from '../../pages/checkout/partials/checkout-footer'
import SiteLayout from '../site-layout'

export const getLayout = (page) => {
    return (
        <SiteLayout
            title={'SiteLayout Checkout'}
            header={<CheckoutHeader />}
            footer={<CheckoutFooter />}
        >
            {page}
        </SiteLayout>
    )
}
