/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

// Components
import {Box, Stack} from '@chakra-ui/react'


const PDPLayoutA = ({productView, productHeader, productInformation, productRecommendations}) => {
    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <h1>PDP Layout A</h1>
            {/* Product Header content*/}
            {productHeader}

            {/* Product View content*/}
            <Stack spacing={16}>
                {productView}
                {/* Product Information content*/}
                <Stack direction="row" spacing={[0, 0, 0, 16]}>
                    {productInformation}
                    <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
                </Stack>
            </Stack>
            {/* Product Recommendations content */}
            <Stack spacing={16}>{productRecommendations}</Stack>
        </Box>
    )
}

PDPLayoutA.getTemplateName = () => 'pdp-layout-a'

PDPLayoutA.propTypes = {
    productView: PropTypes.element,
    productHeader: PropTypes.element,
    productInformation: PropTypes.element,
    productRecommendations: PropTypes.element
}

export default PDPLayoutA
