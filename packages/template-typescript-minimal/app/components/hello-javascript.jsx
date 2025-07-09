/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {Box} from '@chakra-ui/react'

const HelloJS = () => {
    const {data} = useProductSearch({
        parameters: {
            q: 'dresses',
        }
    })
    console.log('data-----', data)
    return <Box as='pre' color='red.900' bg='yellow.100'>{data && JSON.stringify(data, null, 2)}</Box>
}

export default HelloJS
