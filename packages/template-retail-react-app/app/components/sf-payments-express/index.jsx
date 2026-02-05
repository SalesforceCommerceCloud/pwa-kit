/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useMemo} from 'react'
import PropTypes from 'prop-types'

import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import SFPaymentsExpressButtons from '@salesforce/retail-react-app/app/components/sf-payments-express-buttons'
import {EXPRESS_PAY_NOW} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'

const SFPaymentsExpress = ({
    expressButtonLayout = 'vertical',
    maximumButtonCount = undefined,
    onPaymentMethodsRendered,
    onExpressPaymentCompleted
}) => {
    // keepPreviousData: true prevents components from unmounting during refetches triggered by
    // SFPaymentsExpressButtons mutations. While mutations typically update the cache immediately,
    // this flag ensures data remains available even if the refetch completes before the cache update.
    const {data: basket} = useCurrentBasket()

    const prepareBasket = useCallback(async () => {
        return basket
    }, [basket?.basketId])
    const [paymentCurrency, paymentCountryCode, initialAmount] = useMemo(
        () => [
            basket?.currency,
            basket?.billingAddress?.countryCode,
            basket?.orderTotal || basket?.productSubTotal
        ],
        [basket?.basketId]
    )

    if (!basket?.basketId) {
        return null
    }

    return (
        <div
            data-testid="sf-payments-express"
            data-button-layout={expressButtonLayout}
            data-maximum-button-count={maximumButtonCount}
        >
            <SFPaymentsExpressButtons
                usage={EXPRESS_PAY_NOW}
                paymentCurrency={paymentCurrency}
                paymentCountryCode={paymentCountryCode}
                initialAmount={initialAmount}
                prepareBasket={prepareBasket}
                expressButtonLayout={expressButtonLayout}
                maximumButtonCount={maximumButtonCount}
                onPaymentMethodsRendered={onPaymentMethodsRendered}
                onExpressPaymentCompleted={onExpressPaymentCompleted}
            />
        </div>
    )
}

SFPaymentsExpress.propTypes = {
    expressButtonLayout: PropTypes.string,
    maximumButtonCount: PropTypes.number,
    onPaymentMethodsRendered: PropTypes.func,
    onExpressPaymentCompleted: PropTypes.func
}

export default SFPaymentsExpress
