/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef} from 'react'
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
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Box,
    Stack,
    useBreakpointValue
} from '@chakra-ui/react'
import {ChevronDownIcon} from '@chakra-ui/icons'
import {useProducts} from '@salesforce/commerce-sdk-react'
import ProductList from '@salesforce/retail-react-app/app/components/product-list'
import {
    messages,
    CANCELLATION_REASONS
} from '@salesforce/retail-react-app/app/components/cancel-order-modal/constants'

const onClient = typeof window !== 'undefined'

/**
 * Modal component for requesting order cancellation.
 * Displays order products and provides a dropdown for selecting cancellation reasons.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Callback to close the modal
 * @param {Object} order - Order object containing productItems and currency
 * @param {Function} onCancel - Callback fired when cancellation is requested (order, reason)
 * @returns {JSX.Element} Modal component with order content or "No order provided" message
 */
const CancelOrderModal = ({isOpen, onClose, order, onCancel}) => {
    const intl = useIntl()
    const [selectedReason, setSelectedReason] = useState('')
    const headerRef = useRef(null)

    // Fetch product data for order items
    const productIds = order?.productItems?.map((product) => product.productId) || []
    const {data: products, isLoading} = useProducts(
        {
            parameters: {
                ids: productIds.join(','),
                allImages: true
            }
        },
        {
            enabled: !!productIds.length && onClient,
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    // Merge product data with order items
    const variants =
        order?.productItems?.map((item) => {
            const product = products?.[item.productId]
            return {
                ...(product ? product : {}),
                isProductUnavailable: !product,
                ...item
            }
        }) || []

    // For responsive sizing
    const modalSize = useBreakpointValue({base: 'full', md: '2xl'})
    const buttonSize = useBreakpointValue({base: 'lg', md: 'md'})

    const cancellationReasons = CANCELLATION_REASONS.map((reason) => ({
        id: reason.id,
        label: intl.formatMessage(messages[reason.messageKey])
    }))

    const getCancellationReasonDisplayText = () => {
        if (selectedReason) {
            return cancellationReasons.find((reason) => reason.id === selectedReason)?.label
        }
        return intl.formatMessage(messages.selectReason)
    }

    const handleCancel = () => {
        onCancel(order, selectedReason)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            initialFocusRef={headerRef}
            size={modalSize}
            isCentered
            scrollBehavior="inside"
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader ref={headerRef} tabIndex={-1}>
                    <FormattedMessage {...messages.requestCancellation} />
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    {order ? (
                        !isLoading ? (
                            <ProductList
                                variants={variants}
                                currency={order.currency}
                                imageWidth="20"
                                padding={4}
                                spacing={2}
                            />
                        ) : (
                            <Box textAlign="center" color="gray.500" fontSize="md" py={8}>
                                Loading products...
                            </Box>
                        )
                    ) : (
                        <Box textAlign="center" color="gray.500" fontSize="md" py={8}>
                            <FormattedMessage {...messages.noOrderProvided} />
                        </Box>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Stack
                        direction={['column', 'row']}
                        spacing={4}
                        w="full"
                        justify="space-between"
                        align="center"
                    >
                        {/* Cancellation Reason Dropdown */}
                        <Box w="full" flex={1}>
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    variant="outline"
                                    size={buttonSize}
                                    w="full"
                                    textAlign="left"
                                    justifyContent="space-between"
                                    fontWeight="normal"
                                    color={selectedReason ? 'black' : 'gray.500'}
                                    isDisabled={!order}
                                >
                                    {getCancellationReasonDisplayText()}
                                </MenuButton>
                                <MenuList maxH="72" overflowY="auto">
                                    {cancellationReasons.map((reason) => (
                                        <MenuItem
                                            key={reason.id}
                                            onClick={() => setSelectedReason(reason.id)}
                                            bg={
                                                selectedReason === reason.id ? 'blue.50' : undefined
                                            }
                                            color={
                                                selectedReason === reason.id
                                                    ? 'blue.600'
                                                    : reason.isDefault
                                                    ? 'gray.500'
                                                    : undefined
                                            }
                                            fontWeight={
                                                selectedReason === reason.id ? 'medium' : undefined
                                            }
                                        >
                                            {reason.label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        </Box>

                        {/* Request Cancellation Button */}
                        <Button
                            colorScheme="blue"
                            onClick={handleCancel}
                            size={buttonSize}
                            w={['full', 'auto']}
                            isDisabled={!order}
                        >
                            <FormattedMessage {...messages.requestCancellation} />
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
    order: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired
}

export default CancelOrderModal
