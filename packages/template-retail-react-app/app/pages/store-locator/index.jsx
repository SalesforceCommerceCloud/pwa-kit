/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import {Box, Container} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'
import {useSearchStores} from '@salesforce/commerce-sdk-react'
import {
    DEFAULT_STORE_LOCATOR_COUNTRY_CODE,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_DISTANCE
} from '@salesforce/retail-react-app/app/constants'
import {useForm} from 'react-hook-form'

const StoreLocator = () => {
    const intl = useIntl()

    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY_CODE,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE
    })
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: searchStoresParams.countryCode,
            postalCode: searchStoresParams.postalCode
        }
    })
    var {data: searchStoresData, isLoading} = useSearchStores({
        parameters: {
            countryCode: searchStoresParams.countryCode,
            postalCode: searchStoresParams.postalCode,
            locale: intl.locale,
            maxDistance: STORE_LOCATOR_DISTANCE
        }
    })

    const storesInfo = isLoading ? undefined : searchStoresData?.data || []

    const submitForm = async (formData) => {
        const {postalCode, countryCode} = formData
        setSearchStoresParams({
            postalCode: postalCode,
            countryCode: countryCode
        })
    }

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
                    form={form}
                    submitForm={submitForm}
                    storesInfo={storesInfo}
                    searchStoresParams={searchStoresParams}
                />
            </Container>
        </Box>
    )
}

StoreLocator.getTemplateName = () => 'store-locator'

StoreLocator.propTypes = {}

export default StoreLocator
