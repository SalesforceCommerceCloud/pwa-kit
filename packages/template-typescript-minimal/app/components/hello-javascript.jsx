/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useProductSearch} from '@salesforce/commerce-sdk-react'
import {Box, Text} from '@chakra-ui/react'

const HelloJS = () => {
    const {data} = useProductSearch({
        parameters: {
            q: 'dresses',
        }
    })

    return <Box>
        <Text as='h2'>HELLOJS data</Text>
        <Box as='pre' color='red.900' bg='yellow.100' height='300px' overflow='scroll'>{data && JSON.stringify(data, null, 2)}</Box>
    </Box>
}

export default HelloJS
