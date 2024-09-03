/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {useDNT} from '@salesforce/commerce-sdk-react'
const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white'
}

const UseDntHook = () => {
    const [displayButton, setDisplayButton] = useState(false)
    const {dntNotSet, updateDNT} = useDNT()
    useEffect(() => {
        if (dntNotSet) setDisplayButton(true)
    }, [])

    return displayButton ? (
        <button
            style={buttonStyle}
            onClick={() => {
                void (async () => {
                    await updateDNT(true)
                })()
                setDisplayButton(false)
            }}
        >
            DNT cookie is not set, click this button to update DNT
        </button>
    ) : (
        <div>DNT cookie is successfully set</div>
    )
}

UseDntHook.getTemplateName = () => 'UseDntHook'

export default UseDntHook
