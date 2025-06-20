/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {noop} from '../../utils/utils'
import {Button, Dialog, Text, useDisclosure} from '@chakra-ui/react'

import PropTypes from 'prop-types'
import {CONFIRMATION_DIALOG_DEFAULT_CONFIG} from '../../pages/account/constant'
import {useIntl} from 'react-intl'

const ConfirmationModal = ({
    dialogTitle = CONFIRMATION_DIALOG_DEFAULT_CONFIG.dialogTitle,
    confirmationMessage = CONFIRMATION_DIALOG_DEFAULT_CONFIG.confirmationMessage,
    primaryActionLabel = CONFIRMATION_DIALOG_DEFAULT_CONFIG.primaryActionLabel,
    primaryActionAriaLabel = CONFIRMATION_DIALOG_DEFAULT_CONFIG.primaryActionAriaLabel,
    alternateActionLabel = CONFIRMATION_DIALOG_DEFAULT_CONFIG.alternateActionLabel,
    alternateActionAriaLabel = CONFIRMATION_DIALOG_DEFAULT_CONFIG.alternateActionAriaLabel,
    hideAlternateAction = false,
    onPrimaryAction = noop,
    onAlternateAction = noop,
    ...props
}) => {
    const {formatMessage} = useIntl()
    const handleConfirmClick = () => {
        onPrimaryAction()
        props.onClose()
    }

    const handleAlternateActionClick = () => {
        onAlternateAction()
        props.onClose()
    }

    return (
        <Dialog.Root
            open={props.open}
            placement="center"
            onOpenChange={({open}) => !open && handleAlternateActionClick()}
            role="alertdialog"
            {...props}
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>{formatMessage(dialogTitle)}</Dialog.Header>
                    <Dialog.Body>
                        <Text>{formatMessage(confirmationMessage)}</Text>
                    </Dialog.Body>

                    <Dialog.Footer>
                        {!hideAlternateAction ? (
                            <Button
                                variant="ghost"
                                mr={3}
                                aria-label={formatMessage(alternateActionAriaLabel)}
                                onClick={handleAlternateActionClick}
                            >
                                {formatMessage(alternateActionLabel)}
                            </Button>
                        ) : null}
                        <Button
                            variant="solid"
                            onClick={handleConfirmClick}
                            aria-label={formatMessage(primaryActionAriaLabel)}
                        >
                            {formatMessage(primaryActionLabel)}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}

ConfirmationModal.propTypes = {
    /**
     * Prop to check if modal is open
     */
    open: PropTypes.bool.isRequired,
    /**
     * Callback invoked to open the modal
     */
    onOpen: PropTypes.func.isRequired,
    /**
     * Callback invoked to close the modal
     */
    onClose: PropTypes.func.isRequired,
    /**
     * Text to be displayed as modal header
     */
    dialogTitle: PropTypes.object,
    /**
     * Text to display in confirmation modal prompting user to pick an action
     */
    confirmationMessage: PropTypes.object,
    /**
     * Button Label for primary action in confirmation modal
     */
    primaryActionLabel: PropTypes.object,
    /**
     * Button aria Label for primary action
     */
    primaryActionAriaLabel: PropTypes.object,
    /**
     * Button Label for alternate or secondary action in confirmation modal
     */
    alternateActionLabel: PropTypes.object,
    /**
     * Button aria Label for alternate or secondary action in confirmation modal
     */
    alternateActionAriaLabel: PropTypes.object,
    /**
     * Action to execute if user selects primary action
     */
    onPrimaryAction: PropTypes.func,
    /**
     * Action to execute if user selects alternate or secondary action
     */
    onAlternateAction: PropTypes.func,
    /**
     * Flag to hide of show alternative button
     */
    hideAlternateAction: PropTypes.bool
}

export default ConfirmationModal
