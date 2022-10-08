/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {usePromotions} from 'commerce-sdk-react'
import {Link, useParams} from 'react-router-dom'
import Json from '../components/Json'

function UsePromotions() {
    const {data, isLoading, error} = usePromotions({ids: '10offsuits'})
    if (isLoading) {
        return (
            <div>
                <h1>usePromotions page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>useProducts page</h1>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </>
    )
}

export default UsePromotions
