/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Project Components
import {Accordion, Heading, Stack, Text} from '@chakra-ui/react'
import Link from '../../../components/link'

// Others
import {noop} from '../../../utils/utils'

const CategoryLinks = ({category = {}, onSelect = noop}) => {
    const intl = useIntl()
    const {formatMessage} = intl
    const {categories = []} = category

    const messages = useMemo(() => ({
        categoriesHeading: formatMessage({
            id: 'category_links.button_text',
            defaultMessage: 'Categories'
        })
    }), [intl])

    return (
        <Accordion.Item
            value="categories"
            paddingBottom={6}
            borderTop="none"
            borderBottom="none"
            key="show-all"
        >
            <Accordion.ItemTrigger cursor="pointer">
                <Heading as="h2" flex="1" textAlign="left" fontSize="md" fontWeight={600}>
                    {messages.categoriesHeading}
                </Heading>
                <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
                <Stack gap={1} paddingLeft={4}>
                    {categories.map(({id, name}) => {
                        return (
                            <Link
                                display="flex"
                                alignItems="center"
                                lineHeight={{base: '44px', lg: '24px'}}
                                key={id}
                                href={`/category/${id}`}
                                onClick={onSelect}
                                useNavLink
                            >
                                <Text fontSize="sm">{name}</Text>
                            </Link>
                        )
                    })}
                </Stack>
            </Accordion.ItemContent>
        </Accordion.Item>
    )
}

CategoryLinks.propTypes = {
    category: PropTypes.object,
    onSelect: PropTypes.func
}

export default CategoryLinks
