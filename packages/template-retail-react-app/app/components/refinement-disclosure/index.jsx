/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useId} from 'react'
import PropTypes from 'prop-types'
import {Box, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import {ChevronDownIcon, ChevronUpIcon} from '@salesforce/retail-react-app/app/components/icons'

/**
 * A controlled show/hide section: a heading button that toggles a region.
 *
 * Open state is owned by the caller and applied through the panel's `hidden`
 * attribute, so the section renders open during SSR whenever `isOpen` is true.
 * This is the property ChakraUI v2's Accordion lacks — it gates each item's open
 * state on a descendant index that is only assigned by a post-mount layout
 * effect, which the server render never runs, forcing every item closed in SSR.
 */
const RefinementDisclosure = ({isOpen, onToggle, label, children, ...styleProps}) => {
    const buttonId = useId()
    const panelId = useId()

    return (
        <Box {...styleProps}>
            <Heading as="h2" fontSize="md">
                <Box
                    as="button"
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={onToggle}
                    display="flex"
                    alignItems="center"
                    width="full"
                    textAlign="left"
                    paddingRight={4}
                    outline={0}
                    _focusVisible={{boxShadow: 'outline'}}
                >
                    <Box as="span" flex="1" fontWeight={600}>
                        {label}
                    </Box>
                    {isOpen ? (
                        <ChevronUpIcon aria-hidden="true" />
                    ) : (
                        <ChevronDownIcon aria-hidden="true" />
                    )}
                </Box>
            </Heading>
            <Box
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                paddingTop={2}
            >
                {children}
            </Box>
        </Box>
    )
}

RefinementDisclosure.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    label: PropTypes.node.isRequired,
    children: PropTypes.node
}

export default RefinementDisclosure
