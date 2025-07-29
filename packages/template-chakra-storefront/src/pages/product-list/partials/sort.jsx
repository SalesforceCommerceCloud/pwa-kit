/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useHistory} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {Field, NativeSelect} from '@chakra-ui/react'

const Sort = ({sortUrls, productSearchResult, basePath, ...otherProps}) => {
    const {formatMessage} = useIntl()
    const history = useHistory()

    const messages = {
        sortByLabel: formatMessage({
            id: 'product_list.drawer.title.sort_by',
            defaultMessage: 'Sort By'
        }),
        sortProductsLabel: formatMessage({
            id: 'product_list.sort_by.label.assistive_msg',
            defaultMessage: 'Sort products by'
        })
    }

    const getSortOptionLabel = (sortOption) => {
        return formatMessage(
            {
                id: 'product_list.select.sort_by',
                defaultMessage: 'Sort By: {sortOption}'
            },
            {sortOption}
        )
    }

    return (
        <Field.Root
            aria-label={messages.sortByLabel}
            data-testid="sf-product-list-sort"
            id="page_sort"
            width="auto"
            {...otherProps}
        >
            <NativeSelect.Root>
                <NativeSelect.Field
                    id="sf-product-list-sort-select"
                    aria-label={messages.sortProductsLabel}
                    value={basePath.replace(/(offset)=(\d+)/i, '$1=0')}
                    onChange={(e) => {
                        history.push(e.target.value)
                    }}
                    height={11}
                    width="240px"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    px={3}
                    py={2}
                    fontSize="sm"
                    bg="white"
                    _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px blue.500'
                    }}
                >
                    {sortUrls.map((href, index) => (
                        <option key={href} value={href}>
                            {getSortOptionLabel(productSearchResult?.sortingOptions[index]?.label)}
                        </option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator
                    position="absolute"
                    right={3}
                    top="50%"
                    transform="translateY(-50%)"
                    pointerEvents="none"
                    color="gray.600"
                />
            </NativeSelect.Root>
        </Field.Root>
    )
}

Sort.propTypes = {
    sortUrls: PropTypes.array,
    productSearchResult: PropTypes.object,
    basePath: PropTypes.string
}

export default Sort
