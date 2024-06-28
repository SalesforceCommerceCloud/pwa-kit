/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import StoreLocatorModalWithHooks from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-modal-with-hooks'
import {
    DEFAULT_STORE_LOCATOR_COUNTRY,
    DEFAULT_STORE_LOCATOR_POSTAL_CODE,
    STORE_LOCATOR_NUM_STORES_PER_LOAD
} from '@salesforce/retail-react-app/app/constants'

const StoreLocatorModal = ({isOpen, onClose}) => {
    const [userHasSetManualGeolocation, setUserHasSetManualGeolocation] = useState(false)

    const [searchStoresParams, setSearchStoresParams] = useState({
        countryCode: DEFAULT_STORE_LOCATOR_COUNTRY.countryCode,
        postalCode: DEFAULT_STORE_LOCATOR_POSTAL_CODE,
        limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
    })

    return isOpen ? (
        <StoreLocatorModalWithHooks
            userHasSetManualGeolocation={userHasSetManualGeolocation}
            setUserHasSetManualGeolocation={setUserHasSetManualGeolocation}
            searchStoresParams={searchStoresParams}
            setSearchStoresParams={setSearchStoresParams}
            isOpen={isOpen}
            onClose={onClose}
        />
    ) : (
        <></>
    )
}

StoreLocatorModal.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func
}

export default StoreLocatorModal
