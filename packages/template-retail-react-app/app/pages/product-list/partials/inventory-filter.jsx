/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {Heading, Checkbox, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useStoreLocatorModal} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

const StoreInventoryFilter = ({toggleFilter, selectedFilters}) => {
    const {isOpen, onOpen} = useStoreLocatorModal()
    const {formatMessage} = useIntl()
    const {selectedStore} = useSelectedStore()
    const storeLocatorModalRef = useRef(false)

    const isChecked = selectedFilters?.ilids !== undefined

    // Apply inventory filter when selected store changes
    useEffect(() => {
        if (selectedStore?.inventoryId && isChecked) {
            toggleFilter({value: selectedStore.inventoryId}, 'ilids', false, false)
        }
    }, [selectedStore])

    // Handle when modal closes after being opened from this component
    useEffect(() => {
        // If modal was opened from here and is now closed, apply filter if store is selected
        if (storeLocatorModalRef.current && !isOpen) {
            storeLocatorModalRef.current = false
            if (selectedStore?.inventoryId) {
                toggleFilter({value: selectedStore.inventoryId}, 'ilids', false, false)
            }
        }
    }, [isOpen, selectedStore, toggleFilter])

    const handleCheckboxChange = (e) => {
        // If no store is selected or no inventoryId, open store locator
        if (!selectedStore?.inventoryId) {
            e.preventDefault()
            storeLocatorModalRef.current = true
            onOpen()
            return
        }

        // Normal checkbox behavior when store is selected
        const checked = e.target.checked
        toggleFilter({value: selectedStore.inventoryId}, 'ilids', !checked, false)
    }

    // Always open store locator when store name text is clicked
    const handleStoreNameClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        storeLocatorModalRef.current = true
        onOpen()
    }

    const storeLinkText =
        selectedStore?.name ||
        formatMessage({
            defaultMessage: 'Select Store',
            id: 'store_inventory_filter.action.select_store'
        })

    return (
        <>
            <Stack
                spacing={4}
                paddingTop={0}
                paddingBottom={6}
                borderBottom="1px solid gray.200"
                data-testid="sf-store-inventory-filter"
            >
                <Heading as="h2" fontSize="md" fontWeight={600}>
                    <FormattedMessage
                        defaultMessage="Shop by Availability"
                        id="store_inventory_filter.heading.shop_by_availability"
                    />
                </Heading>
                <Checkbox
                    data-testid="sf-store-inventory-filter-checkbox"
                    isChecked={isChecked}
                    onChange={handleCheckboxChange}
                    aria-label={formatMessage(
                        {
                            defaultMessage: 'Filter Products by Store Availability at {storeName}',
                            id: 'store_inventory_filter.checkbox.assistive_msg'
                        },
                        {
                            storeName: storeLinkText
                        }
                    )}
                >
                    <FormattedMessage
                        defaultMessage="In stock at {storeName}"
                        id="store_inventory_filter.checkbox.label"
                        values={{
                            storeName: (
                                <Text
                                    as="span"
                                    textDecoration="underline"
                                    cursor="pointer"
                                    onClick={handleStoreNameClick}
                                    _hover={{color: 'blue.500'}}
                                    aria-label={formatMessage(
                                        {
                                            defaultMessage: 'Open Store Locator to {action}',
                                            id: 'store_inventory_filter.link.assistive_msg'
                                        },
                                        {
                                            action: selectedStore?.name
                                                ? formatMessage({
                                                      defaultMessage: 'Change Store',
                                                      id: 'store_inventory_filter.action.change_store'
                                                  })
                                                : formatMessage({
                                                      defaultMessage: 'Select a Store',
                                                      id: 'store_inventory_filter.action.select_store_link'
                                                  })
                                        }
                                    )}
                                >
                                    {storeLinkText}
                                </Text>
                            )
                        }}
                    />
                </Checkbox>
            </Stack>
        </>
    )
}

StoreInventoryFilter.propTypes = {
    toggleFilter: PropTypes.func.isRequired,
    selectedFilters: PropTypes.object
}

export default StoreInventoryFilter
