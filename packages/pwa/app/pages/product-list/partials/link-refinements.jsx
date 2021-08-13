/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {Stack} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import Link from '../../../components/link'

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
                        {value.label}
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
