/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'

// Project Components
import {
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'

// Others
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

const CategoryLinks = ({category = {}, onSelect = noop}) => {
    const {categories = []} = category

    return (
        <AccordionItem paddingBottom={6} borderTop="none" key="show-all">
            <AccordionButton>
                <Text flex="1" textAlign="left" fontSize="md" fontWeight={600}>
                    <FormattedMessage defaultMessage="Categories" id="category_links.button_text" />
                </Text>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                <Stack spacing={1}>
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
            </AccordionPanel>
        </AccordionItem>
    )
}

CategoryLinks.propTypes = {
    category: PropTypes.object,
    onSelect: PropTypes.func
}

export default CategoryLinks
