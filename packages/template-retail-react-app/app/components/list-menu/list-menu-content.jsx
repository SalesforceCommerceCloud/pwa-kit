/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Components
import {
    Container,
    SimpleGrid,
    Stack,

    // Hooks
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import LinksList from '@salesforce/retail-react-app/app/components/links-list'

// Others
import {categoryUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import listMenuStyles from '@salesforce/retail-react-app/app/theme/foundations/list-menu-styles'

const ListMenuContent = ({maxColumns, item, itemsKey, onClose, initialFocusRef}) => {
    const theme = useTheme()
    const {baseStyle} = theme.components.ListMenu
    const {locale} = useIntl()
    const items = item?.[itemsKey] || []

    return (
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
                            ...listMenuStyles.dropdown.text,
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
                                      ...listMenuStyles.dropdown.text,
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
                            color={listMenuStyles.dropdown.text.color}
                            onLinkClick={onClose}
                            {...(index === 0 ? {headingLinkRef: initialFocusRef} : {})}
                        />
                    )
                })}
            </SimpleGrid>
        </Container>
    )
}

ListMenuContent.propTypes = {
    item: PropTypes.object,
    itemsKey: PropTypes.string,
    maxColumns: PropTypes.number,
    onClose: PropTypes.func,
    initialFocusRef: PropTypes.object
}

export {ListMenuContent}
