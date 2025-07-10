/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * A Modal for requesting order cancellation
 */
const CancelOrderModal = ({isOpen, onClose, order, onRequestCancellation, ...props}) => {
    const handleRequestCancellation = () => {
        if (onRequestCancellation) {
            onRequestCancellation(order)
        }
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered {...props}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <FormattedMessage
                        defaultMessage="Request Cancellation"
                        id="cancel_order_modal.title.request_cancellation"
                    />
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>
                        <FormattedMessage
                            defaultMessage="This is a blank modal for canceling the order."
                            id="cancel_order_modal.content.placeholder"
                        />
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <Button variant="solid" onClick={handleRequestCancellation}>
                        <FormattedMessage
                            defaultMessage="Request Cancellation"
                            id="cancel_order_modal.button.confirm"
                        />
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

CancelOrderModal.propTypes = {
    /**
     * Whether the modal is open
     */
    isOpen: PropTypes.bool.isRequired,
    /**
     * Callback to close the modal
     */
    onClose: PropTypes.func.isRequired,
    /**
     * Order object for cancellation
     */
    order: PropTypes.object,
    /**
     * Callback when user confirms cancellation request
     */
    onRequestCancellation: PropTypes.func
}

CancelOrderModal.defaultProps = {
    order: null,
    onRequestCancellation: null
}

export default CancelOrderModal