/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {AuthModal} from '../../../hooks/use-auth-modal'
import {DntNotification} from '../../../hooks'
import Toaster, {toaster} from '../../../components/toaster'
import loadable from '@loadable/component'
const StoreLocatorModal =
    SFDC_EXT_STORE_LOCATOR && loadable(() => import('../../../pages/store-locator/partial/modal'))

/**
 * AppModals component that renders all app-level modals using React Portals
 * Handles AuthModal, DntNotification, Toaster, and optional StoreLocatorModal
 */
const AppModals = ({
    authModal,
    dntNotification,
    /* @sfdc-extension-block-start SFDC_EXT_STORE_LOCATOR */
    isOpenStoreLocator,
    onCloseStoreLocator
    /* @sfdc-extension-block-end SFDC_EXT_STORE_LOCATOR */
}) => {
    return (
        <>
            {/* Authentication Modal */}
            <AuthModal {...authModal} />

            {/* Do Not Track Notification */}
            <DntNotification {...dntNotification} />

            {/* Toast Notifications */}
            <Toaster toaster={toaster} />

            {/* @sfdc-extension-line SFDC_EXT_STORE_LOCATOR */}
            <StoreLocatorModal isOpen={isOpenStoreLocator} onClose={onCloseStoreLocator} />
        </>
    )
}

AppModals.propTypes = {
    authModal: PropTypes.object,
    dntNotification: PropTypes.object,
    /* @sfdc-extension-block-start SFDC_EXT_STORE_LOCATOR */
    isOpenStoreLocator: PropTypes.bool,
    onCloseStoreLocator: PropTypes.func
    /* @sfdc-extension-block-end SFDC_EXT_STORE_LOCATOR */
}

export default AppModals
