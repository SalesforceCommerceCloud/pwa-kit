/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {usePasskeyUser} from '@salesforce/commerce-sdk-react'
import {useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import PasskeyRegistrationModal from '@salesforce/retail-react-app/app/components/passkey-registration-modal'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {usePasskeyRegistrationToast} from '@salesforce/retail-react-app/app/hooks/use-passkey-registration-toast'

export const PasskeyRegistrationContext = createContext(null)

export const PasskeyRegistrationProvider = ({children}) => {
    const passkeyModal = useDisclosure()
    const onSuccessRef = useRef(null)
    const [pendingToast, setPendingToast] = useState(false)

    const {showToast} = usePasskeyRegistrationToast({onOpenModal: passkeyModal.onOpen})

    const {data: customer} = useCurrentCustomer()
    const loginId = customer?.login || customer?.email || ''
    const isRegistered = !!customer?.isRegistered
    const passkeyEnabled = !!getConfig()?.app?.login?.passkey?.enabled

    const {data: passkeyUser, isFetched} = usePasskeyUser(
        {loginId},
        {enabled: passkeyEnabled && isRegistered && !!loginId}
    )

    useEffect(() => {
        // Wait for passkey user data to be fetched
        if (!pendingToast || !isFetched) return
        setPendingToast(false)

        // If user has passkeys, don't show toast
        const hasPasskeys = (passkeyUser?.credentials?.length ?? 0) > 0
        if (hasPasskeys) return

        showToast()
    }, [isFetched, passkeyUser, pendingToast])

    const value = {
        passkeyModal: {
            isOpen: passkeyModal.isOpen,
            onOpen: passkeyModal.onOpen,
            onClose: passkeyModal.onClose,
            setOnSuccess: (fn) => {
                onSuccessRef.current = fn
            }
        },
        showRegisterPasskeyToast: () => setPendingToast(true)
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
