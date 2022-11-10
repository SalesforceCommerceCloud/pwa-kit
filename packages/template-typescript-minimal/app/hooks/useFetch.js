/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import useBuyer from './useBuyer'
import {useQuery} from '@tanstack/react-query'

const useFetch = async (url, options) => {
    const context = useQuery()
    // const res = await fetch([], {
    //     headers: {
    //         Authorization: `Bearer ${token}`
    //     }
    // })
    // const data = res.json()
    // return data
}

export default useFetch
