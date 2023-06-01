/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {usePromotionsForCampaign} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

const UsePromotionsForCampaign = () => {
    // campaign id need to be encoded before sent off, it could have special char.
    // e.g "50% off order"
    const campaignId = encodeURI('promotion-campaign')
    const {
        data: result,
        isLoading,
        error
    } = usePromotionsForCampaign({
        parameters: {
            campaignId
        }
    })
    if (isLoading) {
        return (
            <div>
                <h1>Promotions for a Campaign</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            <h1>Promotions for a Campaign</h1>
            {result?.data?.map(({id, name}) => {
                return (
                    <div key={id} style={{marginBottom: '10px'}}>
                        <div>Name: {name}</div>
                        <div>Id: {id}</div>
                    </div>
                )
            })}
            <hr />
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

export default UsePromotionsForCampaign
