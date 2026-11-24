/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Button, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'
import SmartSearchInput from '@salesforce/retail-react-app/app/components/commerce-agent-search/search-input'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {smartSearchColors} from '@salesforce/retail-react-app/app/components/commerce-agent-search/styles'

const SmartSearchHeaderControls = ({storefront, onLogoClick, onAgentClick, children}) => (
    <>
        <Button
            onClick={onLogoClick}
            variant="unstyled"
            flexShrink={0}
            color={smartSearchColors.ink}
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.14em"
            fontSize="sm"
        >
            {storefront.brand}
        </Button>
        <Box display={{base: 'contents', lg: 'none'}}>{children}</Box>
        <Flex
            as="nav"
            aria-label="Shop by category"
            display={{base: 'none', lg: 'flex'}}
            gap={{lg: 3, xl: 5}}
            fontSize="sm"
            color={smartSearchColors.ink}
        >
            {storefront.collections.slice(0, 6).map(({id, label}) => (
                <Link key={id} to={'/category/' + id} whiteSpace="nowrap">
                    {label}
                </Link>
            ))}
        </Flex>
        <Box
            flex={{base: '1 0 100%', lg: '1 1 235px'}}
            maxW={{lg: '560px'}}
            mx={{lg: 'auto'}}
            order={{base: 2, lg: 0}}
        >
            <SmartSearchInput
                aria-label="Search or ask AI"
                placeholder="Search or ask AI…"
                height="46px"
            />
        </Box>
        {onAgentClick && (
            <Button
                aria-label="Ask Shopping Agent"
                size="sm"
                borderRadius="8px"
                bg={smartSearchColors.tint}
                color={smartSearchColors.accent}
                leftIcon={<SparkleIcon boxSize={4} />}
                onClick={onAgentClick}
            >
                Chat with AI
            </Button>
        )}
    </>
)

SmartSearchHeaderControls.propTypes = {
    storefront: PropTypes.object.isRequired,
    onLogoClick: PropTypes.func.isRequired,
    onAgentClick: PropTypes.func,
    children: PropTypes.node
}

export default SmartSearchHeaderControls
