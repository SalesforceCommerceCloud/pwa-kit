/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'

// Project Components
import {
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'
import CheckboxRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/checkbox-refinements'

// Others
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/components/store-locator-modal/index'

const INVENTORY_ATTRIBUTE_ID = 'ilids'

const StoreAvailabilityRefinement = ({toggleFilter, selectedFilters}) => {
    const {selectedStore, isStoreSelected} = useContext(StoreLocatorContext)

    return (
        <AccordionItem paddingBottom={6} borderTop="none" key="show-all">
            <AccordionButton>
                <Heading as="h2" flex="1" textAlign="left" fontSize="md" fontWeight={600}>
                    <FormattedMessage
                        defaultMessage="Shop By Availability"
                        id="store_availability_refinement.button_text"
                    />
                </Heading>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                <CheckboxRefinements
                    filter={{
                        values: [
                            isStoreSelected
                                ? {value: selectedStore.inventoryId, label: selectedStore.name}
                                : {label: 'Select Store'}
                        ],
                        attributeId: INVENTORY_ATTRIBUTE_ID
                    }}
                    toggleFilter={toggleFilter}
                    selectedFilters={selectedFilters?.[INVENTORY_ATTRIBUTE_ID] || []}
                ></CheckboxRefinements>
            </AccordionPanel>
        </AccordionItem>
    )
}

StoreAvailabilityRefinement.propTypes = {
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.array
}

export default StoreAvailabilityRefinement
