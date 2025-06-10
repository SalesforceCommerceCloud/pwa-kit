/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useRef} from 'react'
import PropTypes from 'prop-types'

import {ListMenuContent} from '../../components/list-menu/list-menu-content'
import {ListMenuTrigger} from '../../components/list-menu/list-menu-trigger'

import {
    Box,
    Popover,
    useDisclosure,
    useSlotRecipe
} from '@chakra-ui/react'

const ListMenuPopover = ({contentComponent, item, name, itemsKey, maxColumns}) => {
    const initialFocusRef = useRef()
    const {isOpen, onClose, onOpen} = useDisclosure()
    const ContentComponent = contentComponent || ListMenuContent
    const recipe = useSlotRecipe({key: 'listMenu'})
    const styles = recipe()

    return (
        <Box onMouseLeave={onClose}>
            <Popover.Root
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
                        <Popover.Content data-testid="popover-menu" css={styles.popoverContent}>
                            <Popover.Body css={styles.popoverBody}>
                                <ContentComponent
                                    item={item}
                                    itemsKey={itemsKey}
                                    initialFocusRef={initialFocusRef}
                                    onClose={onClose}
                                    maxColumns={maxColumns}
                                />
                            </Popover.Body>
                        </Popover.Content>
                    )}
                </Fragment>
            </Popover.Root>
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
