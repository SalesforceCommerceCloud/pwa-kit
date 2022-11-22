/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {getApiUrl, useCheckoutAction, useOrderConfirmed} from '../hooks/useFetch'
import {useQueryClient} from '@tanstack/react-query'
import {Link} from 'react-router-dom'

OrderConfirmed.propTypes = {}

function OrderConfirmed(props) {
    const [data, setData] = React.useState(null)
    const history = useHistory()
    const location = useLocation()
    const queryClient = useQueryClient()
    const checkoutAction = useCheckoutAction(location.state?.checkoutId)
    if (!location.state?.checkoutId) {
        history.push('/')
    }
    React.useEffect(() => {
        checkoutAction.mutate(
            {
                url: getApiUrl(`/checkouts/${location.state?.checkoutId}/orders`)
            },
            {
                onSuccess: (data) => {
                    setData(data)
                    queryClient.invalidateQueries()
                }
            }
        )
    }, [])
    return (
        <div>
            Order Confirmed {JSON.stringify(data, null, 2)}
            <Link to={'/orders'}>Go to orders</Link>
        </div>
    )
}

export default OrderConfirmed
