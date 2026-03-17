/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {createContext, useContext, useRef} from 'react'
import PropTypes from 'prop-types'
import {useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import PasskeyRegistrationModal from '@salesforce/retail-react-app/app/components/passkey-registration-modal'

export const PasskeyRegistrationContext = createContext(null)

export const PasskeyRegistrationProvider = ({children}) => {
    const passkeyModal = useDisclosure()
    const onSuccessRef = useRef(null)

    const value = {
        passkeyModal: {
            isOpen: passkeyModal.isOpen,
            onOpen: passkeyModal.onOpen,
            onClose: passkeyModal.onClose,
            setOnSuccess: (fn) => {
                onSuccessRef.current = fn
            }
        }
    }

    return (
        <PasskeyRegistrationContext.Provider value={value}>
            {children}
            <PasskeyRegistrationModal
                isOpen={passkeyModal.isOpen}
                onClose={passkeyModal.onClose}
                onSuccess={() => onSuccessRef.current?.()}
            />
        </PasskeyRegistrationContext.Provider>
    )
}

PasskeyRegistrationProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export const usePasskeyRegistrationContext = () => {
    const context = useContext(PasskeyRegistrationContext)
    if (!context) {
        throw new Error(
            'usePasskeyRegistrationContext must be used within a PasskeyRegistrationProvider'
        )
    }
    return context
}
