/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Link as ChakraLink} from '@chakra-ui/react'

const Link = React.forwardRef(({children, ...props}, ref) => {
    return (
        <ChakraLink ref={ref} {...props}>
            {children}
        </ChakraLink>
    )
})

Link.displayName = 'Link'

Link.propTypes = {
    children: PropTypes.node
}

export default Link 