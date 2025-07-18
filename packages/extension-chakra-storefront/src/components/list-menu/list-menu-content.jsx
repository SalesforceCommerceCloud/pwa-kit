/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@chakra-ui/react'

const ListMenuContent = ({item, itemsKey, maxColumns}) => {
    const items = item?.[itemsKey] || []

    return (
        <Box>
            {items.map((subItem, index) => (
                <Box key={index} p={2}>
                    {subItem.name || subItem.title}
                </Box>
            ))}
        </Box>
    )
}

ListMenuContent.propTypes = {
    item: PropTypes.object,
    itemsKey: PropTypes.string,
    maxColumns: PropTypes.number
}

export {ListMenuContent} 