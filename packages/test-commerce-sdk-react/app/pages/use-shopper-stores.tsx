/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'
import {Link} from 'react-router-dom'

const UseShopperStores = () => {
    const {
        isLoading,
        error,
        data: result
    } = useSearchStores({
        parameters: {
            countryCode: "US",
            postalCode: "94086",
            locale: "en-US",
            maxDistance: 20012
        }
    }, {})
    if (isLoading) {
        return (
            <div>
                <h1>Stores</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>Stores</h1>
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

UseShopperStores.getTemplateName = () => 'UseShopperStores'

export default UseShopperStores
