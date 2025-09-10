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
    Text,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react'

/**
 * A Modal for requesting order cancellation
 */
const CancelOrderModal = ({isOpen, onClose, order, onRequestCancellation, isLoading, error, ...props}) => {
    const handleCancelOrder = () => {
        if (!onRequestCancellation) {
            console.error('Cancel order modal: onRequestCancellation is required')
            return
        }

        onRequestCancellation(order)
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
                    {/* TODO: Add order details here W-18998712 */}
                    <Text>
                        <FormattedMessage
                            defaultMessage="This is a blank modal for canceling the order."
                            id="cancel_order_modal.content.placeholder"
                        />
                    </Text>
                    
                    {error && (
                        <Alert status="error" mt={4}>
                            <AlertIcon />
                            <AlertTitle>Error!</AlertTitle>
                            <AlertDescription>
                                {error.message || 'Failed to cancel order. Please try again.'}
                            </AlertDescription>
                        </Alert>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button 
                        variant="solid" 
                        onClick={handleCancelOrder}
                        isLoading={isLoading}
                        loadingText="Canceling..."
                        disabled={isLoading}
                    >
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
    order: PropTypes.object.isRequired,
    /**
     * Callback when user confirms cancellation request
     */
    onRequestCancellation: PropTypes.func.isRequired,
    /**
     * Whether the cancel order request is loading
     */
    isLoading: PropTypes.bool,
    /**
     * Error object if cancel order request failed
     */
    error: PropTypes.object
}

export default CancelOrderModal
