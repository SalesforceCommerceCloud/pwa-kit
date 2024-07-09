/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'

// Components
import {Box, Container} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'

// Others
import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'

const StoreLocator = () => {
    const [userHasSetManualGeolocation, setUserHasSetManualGeolocation] = useState(false)
    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
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
                    searchStoresParams={searchStoresParams}
                    setSearchStoresParams={setSearchStoresParams}
                    setUserHasSetManualGeolocation={setUserHasSetManualGeolocation}
                    userHasSetManualGeolocation={userHasSetManualGeolocation}
                />
            </Container>
        </Box>
    )
}

StoreLocator.getTemplateName = () => 'store-locator'

StoreLocator.propTypes = {}

export default StoreLocator
