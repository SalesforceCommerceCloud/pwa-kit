/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {AuthModal} from '../../../hooks/use-auth-modal'
import {DntNotification} from '../../../hooks/use-dnt-notification'
// import StoreLocatorModal from '../../../components/store-locator-modal'

/**
 * AppModals component that renders all app-level modals using React Portals
 * Handles AuthModal, DntNotification, and optional StoreLocatorModal
 */
const AppModals = ({
    authModal,
    dntNotification
    // Uncomment when store locator is enabled
    // isOpenStoreLocator,
    // onCloseStoreLocator
}) => {
    return (
        <>
            {/* Authentication Modal */}
            <AuthModal {...authModal} />

            {/* Do Not Track Notification */}
            <DntNotification {...dntNotification} />

            {/* Store Locator Modal - Disabled until extension is moved */}
            {/*
            <StoreLocatorModal
                isOpen={isOpenStoreLocator}
                onClose={onCloseStoreLocator}
            />
            */}
        </>
    )
}

AppModals.propTypes = {
    authModal: PropTypes.object,
    dntNotification: PropTypes.object
    // Uncomment when store locator is enabled
    // isOpenStoreLocator: PropTypes.bool,
    // onCloseStoreLocator: PropTypes.func
}

export default AppModals
