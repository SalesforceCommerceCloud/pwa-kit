/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, defineMessage} from 'react-intl'
import {
    Button,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'

const dialogTitle = defineMessage({
    defaultMessage: 'Switch to one address?',
    id: 'multi_ship_warning_modal.title.switch_to_one_address'
})

const confirmationMessage = defineMessage({
    defaultMessage:
        'If you switch to one address, the shipping addresses you added for the items will be removed.',
    id: 'multi_ship_warning_modal.message.addresses_will_be_removed'
})

const continueButtonLabel = defineMessage({
    defaultMessage: 'Switch',
    id: 'multi_ship_warning_modal.action.switch_to_one_address'
})

const cancelButtonLabel = defineMessage({
    defaultMessage: 'Cancel',
    id: 'multi_ship_warning_modal.action.cancel'
})

const SingleAddressToggleModal = ({isOpen, onClose, onConfirm, onCancel}) => {
    const {formatMessage} = useIntl()

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const handleCancel = () => {
        onCancel()
        onClose()
    }

    return (
        <AlertDialog
            isOpen={isOpen}
            isCentered
            onClose={handleCancel}
            closeOnEsc={true}
            closeOnOverlayClick={true}
        >
            <AlertDialogOverlay />
            <AlertDialogContent maxW="448px" w="448px" minH="196px" borderRadius="6px">
                <AlertDialogHeader>{formatMessage(dialogTitle)}</AlertDialogHeader>
                <AlertDialogBody>
                    <Text>{formatMessage(confirmationMessage)}</Text>
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        mr={3}
                        onClick={handleCancel}
                        aria-label={formatMessage(cancelButtonLabel)}
                    >
                        {formatMessage(cancelButtonLabel)}
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleConfirm}
                        aria-label={formatMessage(continueButtonLabel)}
                    >
                        {formatMessage(continueButtonLabel)}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

SingleAddressToggleModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
}

export default SingleAddressToggleModal
