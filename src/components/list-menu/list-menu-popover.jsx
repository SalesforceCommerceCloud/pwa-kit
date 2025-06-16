/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Box, Popover, Portal, useSlotRecipe} from '@chakra-ui/react'

import {ListMenuContent} from '../../components/list-menu/list-menu-content'
import {ListMenuTrigger} from '../../components/list-menu/list-menu-trigger'

const ListMenuPopover = ({contentComponent, item, name, itemsKey, maxColumns}) => {
    const [open, setOpen] = useState(false)
    const onOpen = () => setOpen(true)
    const onClose = () => setOpen(false)
    const ContentComponent = contentComponent || ListMenuContent
    const recipe = useSlotRecipe({key: 'listMenu'})
    const styles = recipe()

    return (
        <Popover.Root
            open={open}
            onOpenChange={setOpen}
            positioning={{placement: 'bottom-start'}}
            lazyMounted
            portalled
            unstyled
        >
            <Popover.Trigger asChild>
                <Box onMouseEnter={onOpen} onMouseLeave={onClose}>
                    <ListMenuTrigger
                        item={item}
                        name={name}
                        isOpen={open}
                        onOpen={onOpen}
                        onClose={onClose}
                    />
                </Box>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner>
                    <Popover.Content data-testid="popover-menu" css={styles.popoverContent}>
                        <Popover.Body css={styles.popoverBody}>
                            <ContentComponent
                                    item={item}
                                    itemsKey={itemsKey}
                                    onClose={onClose}
                                    maxColumns={maxColumns}
                                />
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
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
