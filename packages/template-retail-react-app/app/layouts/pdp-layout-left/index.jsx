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

const PDPLayoutLeft = ({productView, helmet, informationAccordion, productRecommendations}) => {
    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            {helmet}
            <h1>PDP Layout Left</h1>
            <Stack spacing={16}>
                {productView}
                {/* Information Accordion */}
                <Stack direction="row" spacing={[0, 0, 0, 16]}>
                    {informationAccordion}
                    <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
                </Stack>
            </Stack>
            {/* Product Recommendations */}
            <Stack spacing={16}>{productRecommendations}</Stack>
        </Box>
    )
}

PDPLayoutLeft.getTemplateName = () => 'pdp-layout-left'

PDPLayoutLeft.propTypes = {
    productView: PropTypes.element,
    helmet: PropTypes.element,
    informationAccordion: PropTypes.element,
    productRecommendations: PropTypes.element
}

export default PDPLayoutLeft
