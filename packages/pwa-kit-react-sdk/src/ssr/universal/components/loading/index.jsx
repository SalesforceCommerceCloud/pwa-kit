/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useHistory} from 'react-router-dom'

const Loading = () => {
    const history = useHistory()
    console.log('--- history in Loading', history)

    // TODO
    return <div>Loading...</div>
}

export default Loading
