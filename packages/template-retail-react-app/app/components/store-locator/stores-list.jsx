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
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    Box
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
/**
 * A Modal that contains Product View
 */
const StoresList = (props) => {
    const {searchStoresParams} = props
    const intl = useIntl()
    var searchStoresData = useSearchStores({
        parameters: {
            countryCode: searchStoresParams?.countryCode,
            postalCode: searchStoresParams?.postalCode,
            locale: intl.locale,
            maxDistance: 100
        }
    })
    var storesInfo = (searchStoresData?.data?.data || []).sort((a, b) => a.distance - b.distance)
    return storesInfo?.map((store, index) => {
        return (
            <AccordionItem key={index}>
                <Box margin="10px">
                    <Box fontSize="lg">{store.name}</Box>
                    <Box fontSize="md" color="gray.600">
                        {store.address1}
                    </Box>
                    <Box fontSize="md" color="gray.600">
                        {store.city}, {store.stateCode ? store.stateCode : ''} {store.postalCode}
                    </Box>
                    <br />
                    <Box fontSize="md" color="gray.600">
                        {store.distance} {store.distanceUnit}{' '}
                        {intl.formatMessage({
                            id: 'store_locator.description.away',
                            defaultMessage: 'away'
                        })}
                    </Box>
                    <br />
                    {store.phone ? (
                        <>
                            <Box fontSize="md" color="gray.600">
                                {intl.formatMessage({
                                    id: 'store_locator.description.phone',
                                    defaultMessage: 'Phone:'
                                })}{' '}
                                {store.phone}
                            </Box>
                        </>
                    ) : (
                        ''
                    )}
                    <AccordionButton color="blue.700" style={{marginTop: '10px'}}>
                        <Box fontSize="lg">
                            {intl.formatMessage({
                                id: 'store_locator.action.viewMore',
                                defaultMessage: 'View More'
                            })}
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel mb={6} mt={4}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: store?.storeHours
                            }}
                        />
                    </AccordionPanel>
                </Box>
            </AccordionItem>
        )
    })
}

StoresList.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired
}

export default StoresList
