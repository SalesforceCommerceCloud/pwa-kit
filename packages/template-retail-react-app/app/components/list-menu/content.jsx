/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Project Components
import LinksList from '@salesforce/retail-react-app/app/components/links-list'
import PopoverContent from '@salesforce/retail-react-app/app/components/list-menu/content'

// Components
import {
    Container,
    SimpleGrid,
    Stack,
    PopoverContent,
    PopoverBody,

    // Hooks
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Others
import {categoryUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

/**
 * 
 * @param {*} param0 
 * @returns 
 */
const ListMenuContent = ({maxColumns, items, itemsKey, onClose, initialFocusRef}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu
    const {locale} = useIntl()

    return (
        <PopoverContent data-testid="popover-menu" {...baseStyle.popoverContent}>
            <PopoverBody>
                <Container as={Stack} {...baseStyle.popoverContainer}>
                    <SimpleGrid
                        spacing={8}
                        justifyContent={'left'}
                        gridTemplateColumns={`repeat(${
                            items.length > maxColumns ? maxColumns : items.length
                        }, minmax(0, 21%))`}
                        marginInlineStart={{lg: '68px', xl: '96px'}}
                    >
                        {items.map((item, index) => {
                            const {id, name} = item
                            const items = item[itemsKey]

                            const heading = {
                                href: categoryUrlBuilder(item, locale),
                                text: name,
                                styles: {
                                    fontSize: 'md',
                                    marginBottom: 2
                                }
                            }

                            const links = items
                                ? items.map((item) => {
                                      const {name} = item
                                      return {
                                          href: categoryUrlBuilder(item, locale),
                                          text: name,
                                          styles: {
                                              fontSize: 'md',
                                              paddingTop: 3,
                                              paddingBottom: 3
                                          }
                                      }
                                  })
                                : []
                            return (
                                <LinksList
                                    key={id}
                                    heading={heading}
                                    links={links}
                                    color={'gray.900'}
                                    onLinkClick={onClose}
                                    {...(index === 0 ? {headingLinkRef: initialFocusRef} : {})}
                                />
                            )
                        })}
                    </SimpleGrid>
                </Container>
            </PopoverBody>
        </PopoverContent>
    )
}

ListMenuContent.propTypes = {
    items: PropTypes.array,
    maxColumns: PropTypes.number,
    onClose: PropTypes.func,
    initialFocusRef: PropTypes.object,
    itemsKey: PropTypes.string
}

export default ListMenuContent