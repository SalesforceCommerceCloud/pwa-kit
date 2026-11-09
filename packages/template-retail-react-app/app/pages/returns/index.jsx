/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Helmet} from 'react-helmet'
import {Box, Heading, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

// Placeholder page for demos.
const Returns = () => (
    <Box layerStyle="page" className="returns" padding={{lg: 8, md: 6, base: 4}}>
        <Helmet>
            <title>Returns</title>
        </Helmet>
        <Heading as="h1" mb={4}>
            Returns
        </Heading>
        <Text>60 days</Text>
    </Box>
)

export default Returns
