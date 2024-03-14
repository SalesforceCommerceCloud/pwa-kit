/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useRef} from 'react'
import PropTypes from 'prop-types'

// Project Components
import {ListMenuContent} from '@salesforce/retail-react-app/app/components/list-menu/list-menu-content'
import {ListMenuTrigger} from '@salesforce/retail-react-app/app/components/list-menu/list-menu-trigger'

// Components
import {
    Box,
    Popover,
    PopoverContent,
    PopoverBody,

    // Hooks
    useDisclosure,
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'

const ListMenuPopover = ({contentComponent, item, name, itemsKey, maxColumns}) => {
    const initialFocusRef = useRef()
    const {isOpen, onClose, onOpen} = useDisclosure()
    const ContentComponent = contentComponent || ListMenuContent
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu

    return (
        <Box onMouseLeave={onClose}>
            <Popover
                isLazy
                placement={'bottom-start'}
                initialFocusRef={initialFocusRef}
                onOpen={onOpen}
                onClose={onClose}
                isOpen={isOpen}
                variant="fullWidth"
            >
                <Fragment>
                    <ListMenuTrigger
                        item={item}
                        name={name}
                        isOpen={isOpen}
                        onOpen={onOpen}
                        onClose={onClose}
                    />
                    {isOpen && (
                        <PopoverContent data-testid="popover-menu" {...baseStyle.popoverContent}>
                            <PopoverBody {...baseStyle.popoverBody}>
                                <ContentComponent
                                    item={item}
                                    itemsKey={itemsKey}
                                    initialFocusRef={initialFocusRef}
                                    onClose={onClose}
                                    maxColumns={maxColumns}
                                />
                            </PopoverBody>
                        </PopoverContent>
                    )}
                </Fragment>
            </Popover>
        </Box>
    )
}

ListMenuPopover.propTypes = {
    contentComponent: PropTypes.elementType,
    item: PropTypes.object,
    name: PropTypes.string,
    maxColumns: PropTypes.number,
    itemsKey: PropTypes.string
}

export {ListMenuPopover}
