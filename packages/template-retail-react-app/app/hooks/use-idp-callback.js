/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import useIDPAuth from '@salesforce/retail-react-app/app/hooks/use-idp-auth'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'

/**
 * A hook that handles the IDP callback
 *
 * @param {Object} props
 * @param {{missingParameters: String}} props.labels
 *
 * @returns {{customer: Object, error: String}} The current customer and error
 */
export const useIdpCallback = ({labels}) => {
    const idpAuth = useIDPAuth()
    const {data: customer} = useCurrentCustomer()
    const [params] = useSearchParams()
    const [error, setError] = useState(params.error_description)

    useEffect(() => {
        // If there is an error in the URL, we don't need to do anything else
        if (error) {
            return
        }

        // We need to make sure we have the usid and code in the URL
        if (!params.usid || !params.code) {
            setError(labels?.missingParameters)

            return
        }

        idpAuth.processIdpResult(params.usid, params.code).catch((error) => {
            setError(error.message)
        })
    }, [])

    return {customer, error}
}
