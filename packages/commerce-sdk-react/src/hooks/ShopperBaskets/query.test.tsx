/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {
    useBasket,
    usePaymentMethodsForBasket,
    usePriceBooksForBasket,
    useShippingMethodsForShipment,
    useTaxesFromBasket,
} from './query'
import {screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const BasketComponent = ({basketId}: {basketId: string}): ReactElement => {
    const {data, isLoading, error} = useBasket({basketId})

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <>
                    {basketId && <h3>Basket ID: {basketId}</h3>}
                    <div>Customer Id: {data?.customerInfo?.customerId}</div>
                    <p>Items in Basket: {data?.productItems?.length}</p>
                </>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const tests = [{
    hook: 'useBasket',
    cases: [{
        name: 'returns basket',
        assertions: withMocks(async () => {
            const basketId = 'a10ff320829cb0eef93ca5310a'
            renderWithProviders(<BasketComponent basketId={basketId} />)
        })
    }]
}]