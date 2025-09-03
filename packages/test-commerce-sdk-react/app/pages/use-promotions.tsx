/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {usePromotions} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

function UsePromotions() {
    const {
        data: result,
        isLoading,
        error
    } = usePromotions({parameters: {ids: '10offsuits,50%offorder'}})
    if (isLoading) {
        return (
            <div>
                <h1>Promotions</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>Promotions:</h1>
            {result?.data?.map(({id, name}) => {
                return (
                    <div key={id} style={{marginBottom: '10px'}}>
                        <div>Name: {name}</div>
                        <div>id: {id}</div>
                    </div>
                )
            })}
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, result}} />
        </>
    )
}

export default UsePromotions
