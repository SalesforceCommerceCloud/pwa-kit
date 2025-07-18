/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'

import {Box, Button, useSlotRecipe} from '@chakra-ui/react'

import Link from '../../components/link'
import {ChevronDownIcon} from '../../components/icons'

import {categoryUrlBuilder} from '../../utils/url'

const ListMenuTrigger = ({item, name, isOpen}) => {
    const recipe = useSlotRecipe({key: 'listMenu'})
    const styles = recipe()

    return (
        <Box css={styles.listMenuTriggerContainer}>
            <Link
                as={RouteLink}
                to={categoryUrlBuilder(item)}
                css={styles.listMenuTriggerLink}
                {...{name: name + ' __'}}
                {...(isOpen ? {css: styles.listMenuTriggerLinkActive} : {})}
            >
                {name}
            </Link>

            <Button unstyled css={styles.listMenuTriggerLinkIcon}>
                <ChevronDownIcon />
            </Button>
        </Box>
    )
}

ListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool
}

export {ListMenuTrigger} 