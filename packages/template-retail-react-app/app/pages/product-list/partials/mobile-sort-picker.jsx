/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {useHistory} from 'react-router-dom'

import {
    Text,
    Button,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton
} from '@salesforce/retail-react-app/app/components/shared/ui'

const MobileSortPicker = (props) => {
    const history = useHistory()
    const {sortOpen, setSortOpen, sortUrls, selectedSortingOptionLabel, productSearchResult} = props
    return (
        <Drawer
            placement="bottom"
            isOpen={sortOpen}
            onClose={() => setSortOpen(false)}
            size="sm"
            motionPreset="slideInBottom"
            scrollBehavior="inside"
            isFullHeight={false}
            height="50%"
        >
            <DrawerOverlay />
            <DrawerContent marginTop={0}>
                <DrawerHeader boxShadow="none">
                    <Text fontWeight="bold" fontSize="2xl">
                        <FormattedMessage
                            defaultMessage="Sort By"
                            id="product_list.drawer.title.sort_by"
                        />
                    </Text>
                </DrawerHeader>
                <DrawerCloseButton />
                <DrawerBody>
                    {sortUrls.map((href, idx) => (
                        <Button
                            width="full"
                            onClick={() => {
                                setSortOpen(false)
                                history.push(href)
                            }}
                            fontSize={'md'}
                            key={idx}
                            marginTop={0}
                            variant="menu-link"
                        >
                            <Text
                                as={
                                    selectedSortingOptionLabel?.label ===
                                        productSearchResult?.sortingOptions[idx]?.label && 'u'
                                }
                            >
                                {productSearchResult?.sortingOptions[idx]?.label}
                            </Text>
                        </Button>
                    ))}
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}

MobileSortPicker.propTypes = {
    sortOpen: PropTypes.bool,
    setSortOpen: PropTypes.func,
    selectedSortingOptionLabel: PropTypes.object,
    sortUrls: PropTypes.arrayOf(PropTypes.string),
    productSearchResult: PropTypes.object
}

export default MobileSortPicker
