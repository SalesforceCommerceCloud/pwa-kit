/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'
import Link from '@salesforce/retail-react-app/app/components/link'

const LinkRefinements = ({filter}) => {
    return (
        <Stack spacing={1}>
            {filter.values.map((value) => {
                return (
                    <Link
                        display="flex"
                        alignItems="center"
                        lineHeight={{base: '44px', lg: '24px'}}
                        key={value.value}
                        href={`/category/${value.value}`}
                        useNavLink
                    >
                        <Text fontSize="sm">{value.label}</Text>
                    </Link>
                )
            })}
        </Stack>
    )
}

LinkRefinements.propTypes = {
    filter: PropTypes.object
}

export default LinkRefinements
