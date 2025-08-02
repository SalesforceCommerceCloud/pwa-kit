/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Popover, useSlotRecipe} from '@chakra-ui/react'

import {ListMenuContent} from '../../components/list-menu/list-menu-content'
import {ListMenuTrigger} from '../../components/list-menu/list-menu-trigger'

const ListMenuPopover = ({contentComponent, item, name, itemsKey, maxColumns}) => {
    const [open, setOpen] = useState(false)
    const handleOpenChange = (details) => {
        setOpen(details.open)
    }

    const ContentComponent = contentComponent || ListMenuContent
    const recipe = useSlotRecipe({key: 'listMenu'})
    const styles = recipe()

    return (
        <Popover.Root
            positioning={{placement: 'bottom-start'}}
            lazyMount
            unstyled
            open={open}
            onOpenChange={handleOpenChange}
        >
            <Popover.Trigger>
                <ListMenuTrigger item={item} name={name} isOpen={open} />
            </Popover.Trigger>
            <Popover.Positioner>
                <Popover.Content data-testid="popover-menu" css={styles.popoverContent}>
                    <Popover.Body css={styles.popoverBody}>
                        <ContentComponent item={item} itemsKey={itemsKey} maxColumns={maxColumns} />
                    </Popover.Body>
                </Popover.Content>
            </Popover.Positioner>
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
