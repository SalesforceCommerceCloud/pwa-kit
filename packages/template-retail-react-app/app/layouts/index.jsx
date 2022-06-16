/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box} from '@chakra-ui/react'

export function IndexLayout({children}) {
    return (
        <Box>
            <h1>IndexLayout</h1>
            {children}
        </Box>
    )
}
