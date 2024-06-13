/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import {useIntl} from 'react-intl'
import {Box, Container} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator/store-locator-content'
import {getDefaultSearchStoresParams} from '@salesforce/retail-react-app/app/components/store-locator/index'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
const StoreLocator = () => {
    const intl = useIntl()

    var defaultSearchStoresParams = getDefaultSearchStoresParams(intl)
    const [searchStoresParams, setSearchStoresParams] = useState(defaultSearchStoresParams)
    var searchStoresData = useSearchStores({
        parameters: {
            countryCode: searchStoresParams.countryCode,
            postalCode: searchStoresParams.postalCode,
            locale: intl.locale,
            maxDistance: 100
        }
    })

    return (
        <Box data-testid="store-locator-page" bg="gray.50" py={[8, 16]}>
            <Seo title="Store Locator" description="Find a Store" />
            <Container
                overflowY="scroll"
                paddingTop={8}
                width={['90%']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <StoreLocatorContent
                    searchStoresData={searchStoresData}
                    searchStoresParams={searchStoresParams}
                    setSearchStoresParams={setSearchStoresParams}
                />
            </Container>
        </Box>
    )
}

StoreLocator.getTemplateName = () => 'store-locator'

StoreLocator.propTypes = {}

export default StoreLocator
