/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Text,
    Stack,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalContent,
    ModalCloseButton,
    ModalOverlay
} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import Refinements from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements'

const MobileRefinements = (props) => {
    const {
        isOpen,
        onClose,
        isRefetching,
        toggleFilter,
        productSearchResult,
        searchParams,
        resetFilters
    } = props

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
            motionPreset="slideInBottom"
            scrollBehavior="inside"
        >
            <ModalOverlay />
            <ModalContent top={0} marginTop={0}>
                <ModalHeader>
                    <Text fontWeight="bold" fontSize="2xl">
                        <FormattedMessage
                            defaultMessage="Filter"
                            id="product_list.modal.title.filter"
                        />
                    </Text>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody py={4}>
                    {isRefetching && <LoadingSpinner />}
                    <Refinements
                        toggleFilter={toggleFilter}
                        filters={productSearchResult?.refinements}
                        selectedFilters={searchParams.refine}
                    />
                </ModalBody>

                <ModalFooter
                    // justify="space-between"
                    display="block"
                    width="full"
                    borderTop="1px solid"
                    borderColor="gray.100"
                    paddingBottom={10}
                >
                    <Stack>
                        <Button width="full" onClick={onClose}>
                            <FormattedMessage
                                id="product_list.modal.button.view_items"
                                defaultMessage="View {prroductCount} items"
                                values={{prroductCount: productSearchResult?.total}}
                            />
                        </Button>
                        <Button width="full" variant="outline" onClick={resetFilters}>
                            <FormattedMessage
                                defaultMessage="Clear Filters"
                                id="product_list.modal.button.clear_filters"
                            />
                        </Button>
                    </Stack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

MobileRefinements.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    isRefetching: PropTypes.bool,
    toggleFilter: PropTypes.func,
    productSearchResult: PropTypes.object,
    searchParams: PropTypes.object,
    resetFilters: PropTypes.func
}

export default MobileRefinements
