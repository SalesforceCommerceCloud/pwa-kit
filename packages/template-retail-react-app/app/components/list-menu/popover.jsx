/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useRef, useCallback} from 'react'
import PropTypes from 'prop-types'

// Project Components
import ListMenuTrigger from '@salesforce/retail-react-app/app/components/list-menu/trigger'
import ListMenuContent from '@salesforce/retail-react-app/app/components/list-menu/content'

// Components
import {
    Box,
    Popover,

    // Hooks
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'


/**
 * 
 * @param {*} param0 
 * @returns 
 */
const ListMenuPopover = (props) => {
    const {items, item, name, itemsKey, maxColumns} = props
    const initialFocusRef = useRef()
    const {isOpen, onClose, onOpen} = useDisclosure()

    const handleOnOpen = useCallback(() => {
        props?.onOpen({
            item,
            name
        })
        onOpen()
    }, [])

    const handleOnClose = useCallback(() => {
        props?.onClose({
            item,
            name
        })
        onClose()
    }, [])

    return (
        <Box onMouseLeave={onClose}>
            <Popover
                isLazy
                placement={'bottom-start'}
                initialFocusRef={initialFocusRef}
                onOpen={handleOnOpen}
                onClose={handleOnClose}
                isOpen={isOpen}
                variant="fullWidth"
            >
                <Fragment>
                    <ListMenuTrigger
                        item={item}
                        name={name}
                        isOpen={isOpen}
                        onOpen={handleOnOpen}
                        onClose={onClose}
                        hasItems={!!items}
                    />
                    
                    <ListMenuContent
                        items={items}
                        itemsKey={itemsKey}
                        initialFocusRef={initialFocusRef}
                        onClose={onClose}
                        maxColumns={maxColumns}
                    />
                </Fragment>
            </Popover>
        </Box>
    )
}

ListMenuPopover.propTypes = {
    items: PropTypes.array,
    item: PropTypes.object,
    name: PropTypes.string,
    maxColumns: PropTypes.number,
    itemsKey: PropTypes.string,
    onOpen: PropTypes.func,
    onClose: PropTypes.func
}

export default ListMenuPopover