/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Heading,
    Accordion,
    AccordionItem,
    Box
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoresList from '@salesforce/retail-react-app/app/components/store-locator-modal/stores-list'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-input'
import {STORE_LOCATOR_DISTANCE} from '@salesforce/retail-react-app/app/constants'

const StoreLocatorContent = ({form, submitForm, storesInfo, searchStoresParams}) => {
    const intl = useIntl()

    return (
        <>
            <Heading fontSize="2xl" style={{marginBottom: '25px'}}>
                {intl.formatMessage({
                    id: 'store_locator.title',
                    defaultMessage: 'Find a Store'
                })}
            </Heading>
            <StoreLocatorInput
                form={form}
                searchStoresParams={searchStoresParams}
                submitForm={submitForm}
            ></StoreLocatorInput>
            <Accordion allowMultiple flex={[1, 1, 1, 5]}>
                {/* Details */}
                <AccordionItem>
                    <Box
                        flex="1"
                        fontWeight="semibold"
                        fontSize="md"
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '20px'
                        }}
                    >
                        {storesInfo.length === 0
                            ? intl.formatMessage({
                                  id: 'store_locator.description.no_locations',
                                  defaultMessage: 'Sorry, there are no locations in this area'
                              })
                            : intl.formatMessage(
                                  {
                                      id: 'store_locator.description.viewing_within',
                                      defaultMessage: 'Viewing stores within {distance} miles'
                                  },
                                  {distance: STORE_LOCATOR_DISTANCE}
                              )}
                    </Box>
                </AccordionItem>
                <StoresList storesInfo={storesInfo} />
            </Accordion>
        </>
    )
}

StoreLocatorContent.propTypes = {
    form: PropTypes.object,
    storesInfo: PropTypes.object,
    searchStoresParams: PropTypes.object,
    submitForm: PropTypes.func
}

export default StoreLocatorContent
