/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Box,
    Text,
    Select,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    messages,
    CANCELLATION_REASONS
} from '@salesforce/retail-react-app/app/components/cancel-order-modal/constants'

const CancelOrderModal = ({isOpen, onClose, order, onCancel, isSubmitting}) => {
    const intl = useIntl()
    const [selectedReason, setSelectedReason] = useState('')

    useEffect(() => {
        if (!isOpen) setSelectedReason('')
    }, [isOpen])

    const cancellationReasons = CANCELLATION_REASONS.filter((r) => !r.isDefault).map((reason) => ({
        id: reason.id,
        label: intl.formatMessage(messages[reason.messageKey])
    }))

    const handleConfirm = () => {
        onCancel(order, selectedReason)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={1}>
                    <FormattedMessage
                        defaultMessage="Cancel order {orderNo}"
                        id="cancel_order_modal.heading.cancel_order"
                        values={{orderNo: order?.orderNo}}
                    />
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pt={0}>
                    <Stack spacing={4}>
                        <Text fontSize="sm" color="gray.600">
                            <FormattedMessage
                                defaultMessage="Select a reason and confirm cancellation."
                                id="cancel_order_modal.text.select_reason_description"
                            />
                        </Text>
                        <Text fontSize="sm">
                            <FormattedMessage
                                defaultMessage="This cancels the entire order."
                                id="cancel_order_modal.text.impact"
                            />
                        </Text>
                        <Box>
                            <label htmlFor="cancel-reason-select">
                                <Text fontSize="sm" fontWeight="semibold" mb={1}>
                                    <FormattedMessage
                                        defaultMessage="Reason"
                                        id="cancel_order_modal.label.reason"
                                    />
                                </Text>
                            </label>
                            <Select
                                id="cancel-reason-select"
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                placeholder={intl.formatMessage(messages.selectReason)}
                            >
                                {cancellationReasons.map((reason) => (
                                    <option key={reason.id} value={reason.id}>
                                        {reason.label}
                                    </option>
                                ))}
                            </Select>
                        </Box>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Stack direction="row" spacing={3}>
                        <Button variant="outline" onClick={onClose} isDisabled={isSubmitting}>
                            <FormattedMessage
                                defaultMessage="Keep order"
                                id="cancel_order_modal.button.keep_order"
                            />
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleConfirm}
                            isDisabled={isSubmitting}
                            isLoading={isSubmitting}
                        >
                            <FormattedMessage
                                defaultMessage="Confirm cancellation"
                                id="cancel_order_modal.button.confirm_cancellation"
                            />
                        </Button>
                    </Stack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

CancelOrderModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    order: PropTypes.object,
    onCancel: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool
}

export default CancelOrderModal
