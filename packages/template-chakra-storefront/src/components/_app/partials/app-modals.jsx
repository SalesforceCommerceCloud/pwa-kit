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
const AppModals = (context) => {
    const {authModal, dntNotification} = context
    const isOpenStoreLocator = SFDC_EXT_STORE_LOCATOR && context.isOpenStoreLocator
    const onCloseStoreLocator = SFDC_EXT_STORE_LOCATOR && context.onCloseStoreLocator
    return (
        <>
            {/* Authentication Modal */}
            <AuthModal {...authModal} />

            {/* Do Not Track Notification */}
            <DntNotification {...dntNotification} />

            {/* Toast Notifications */}
            <Toaster toaster={toaster} />

            {SFDC_EXT_STORE_LOCATOR && (
                <StoreLocatorModal isOpen={isOpenStoreLocator} onClose={onCloseStoreLocator} />
            )}
        </>
    )
}

const propTypes = {
    authModal: PropTypes.object,
    dntNotification: PropTypes.object,
}

SFDC_EXT_STORE_LOCATOR && (
    propTypes.isOpenStoreLocator = PropTypes.bool,
    propTypes.onCloseStoreLocator = PropTypes.func
)

AppModals.propTypes = propTypes
export default AppModals
