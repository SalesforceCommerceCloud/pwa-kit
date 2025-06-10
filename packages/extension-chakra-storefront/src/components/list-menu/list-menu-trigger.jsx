/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef} from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'

import {
    Box,
    Popover,
    useSlotRecipe
} from '@chakra-ui/react'

import Link from '../../components/link'
import {ChevronDownIcon} from '../../components/icons'

import {categoryUrlBuilder} from '../../utils/url'

const ChevronIconTrigger = forwardRef(function ChevronIconTrigger(props, ref) {
    return (
        <Box {...props} ref={ref}>
            <ChevronDownIcon />
        </Box>
    )
})

const ListMenuTrigger = ({item, name, isOpen, onOpen, onClose}) => {
    const recipe = useSlotRecipe({key: 'listMenu'})
    const styles = recipe()

    const keyMap = {
        Escape: () => onClose(),
        Enter: () => onOpen()
    }

    return (
        <Box css={styles.listMenuTriggerContainer}>
            <Link
                as={RouteLink}
                to={categoryUrlBuilder(item)}
                onMouseOver={onOpen}
                css={styles.listMenuTriggerLink}
                {...{name: name + ' __'}}
                {...(isOpen ? {css: styles.listMenuTriggerLinkActive} : {})}
            >
                {name}
            </Link>

            <Popover.Trigger>
                <Link
                    as={RouteLink}
                    to={'#'}
                    onMouseOver={onOpen}
                    onKeyDown={(e) => {
                        keyMap[e.key]?.(e)
                    }}
                    css={styles.listMenuTriggerLinkIcon}
                >
                    <ChevronIconTrigger />
                </Link>
            </Popover.Trigger>
        </Box>
    )
}

ListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func
}

export {ListMenuTrigger}
