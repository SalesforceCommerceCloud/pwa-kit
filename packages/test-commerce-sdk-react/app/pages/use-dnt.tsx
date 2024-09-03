/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useDNT} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

const UseDntHook = () => {
    const {dntNotSet, updateDNT} = useDNT()
    useEffect(() => {
        updateDNT(true)
    })

    return (
        dntNotSet ? <div> DNT not set </div> : <div> DNT is successfully set </div> 
    )
}

UseDntHook.getTemplateName = () => 'UseDntHook'

export default UseDntHook
