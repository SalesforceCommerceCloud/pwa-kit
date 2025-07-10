/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Flex} from '@chakra-ui/react'
import Pagination from '../../../components/pagination'

const PaginationFooter = ({basePath, pageUrls}) => {
    if (!pageUrls || pageUrls.length < 2) {
        return null
    }
    return (
        <Flex justifyContent={['center', 'center', 'flex-start']} paddingTop={8}>
            <Pagination currentURL={basePath} urls={pageUrls} />
        </Flex>
    )
}

PaginationFooter.propTypes = {
    basePath: PropTypes.string,
    pageUrls: PropTypes.array
}

export default PaginationFooter