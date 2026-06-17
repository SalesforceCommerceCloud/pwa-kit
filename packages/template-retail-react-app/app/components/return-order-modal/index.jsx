/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useId, useMemo, useRef} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {useOmsMetaData} from '@salesforce/commerce-sdk-react'
import {
    Alert,
    AlertDescription,
    AlertIcon,
    Box,
    Button,
    Checkbox,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    VisuallyHidden,
    useBreakpointValue,
    useNumberInput
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getDisplayVariationValues} from '@salesforce/retail-react-app/app/utils/product-utils'
import {
    messages,
    buildReturnPayload
} from '@salesforce/retail-react-app/app/components/return-order-modal/constants'

const onClient = typeof window !== 'undefined'

/**
 * Format the variant attributes a shopper sees inline next to the product name.
 *
 * `getDisplayVariationValues` returns a `{label: value}` object; the design
 * shows the values joined with " / " (e.g. "Black / M"). Returns an empty
 * string when product enrichment is not yet loaded so callers can fall back to
 * plain `productName`.
 */
const formatVariationSummary = (item) => {
    if (!item?.variationAttributes?.length) return ''
    const values = getDisplayVariationValues(item.variationAttributes, item.variationValues)
    return Object.values(values || {})
        .filter(Boolean)
        .join(' / ')
}

/**
 * Quantity stepper field. Uses `useNumberInput` + plain `Input` per repo
 * convention (Chakra's `NumberInput` is not exported from the shared UI). The
 * underlying field clamps on blur and on increment/decrement.
 */
const QuantityField = ({value, max, onChange, ariaLabel, id}) => {
    const {getInputProps, getIncrementButtonProps, getDecrementButtonProps} = useNumberInput({
        value,
        min: 1,
        max,
        step: 1,
        clampValueOnBlur: true,
        precision: 0,
        focusInputOnChange: false,
        onChange: (_str, num) => {
            // Chakra's onChange fires with both the string and numeric value;
            // we only persist when we have a finite number to avoid storing
            // "" while the field is being edited.
            if (Number.isFinite(num)) onChange(num)
        }
    })

    const dec = getDecrementButtonProps({variant: 'outline', size: 'sm'})
    const inc = getIncrementButtonProps({variant: 'outline', size: 'sm'})
    const input = getInputProps({
        id,
        textAlign: 'center',
        maxWidth: '64px',
        size: 'sm',
        'aria-label': ariaLabel
    })

    return (
        <HStack spacing={1}>
            <Button data-testid="return-modal-quantity-decrement" {...dec}>
                {'−'}
            </Button>
            <Input {...input} />
            <Button data-testid="return-modal-quantity-increment" {...inc}>
                {'+'}
            </Button>
        </HStack>
    )
}
QuantityField.propTypes = {
    value: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired
}

const ReturnableItemRow = ({item, row, reasons, onToggle, onQuantityChange, onReasonChange}) => {
    const intl = useIntl()
    const checkboxId = useId()
    const quantityId = useId()
    const reasonId = useId()
    const max = item.omsData?.quantityAvailableToReturn ?? 1
    const variation = formatVariationSummary(item)
    const displayName = variation ? `${item.productName} — ${variation}` : item.productName || ''

    return (
        <Box
            p={4}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="base"
            data-testid="return-modal-item-row"
        >
            <HStack alignItems="flex-start" spacing={3}>
                <Checkbox
                    id={checkboxId}
                    isChecked={!!row?.checked}
                    onChange={(e) => onToggle(e.target.checked)}
                    aria-label={intl.formatMessage(messages.itemCheckboxLabel, {
                        name: displayName,
                        count: max
                    })}
                />
                <Stack spacing={1} flex={1}>
                    <Text as="label" htmlFor={checkboxId} fontSize="sm" fontWeight="semibold">
                        {displayName}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                        <FormattedMessage {...messages.availableToReturn} values={{count: max}} />
                    </Text>
                    {row?.checked && (
                        <SimpleGrid columns={{base: 1, sm: 2}} columnGap={4} rowGap={3} mt={2}>
                            <FormControl>
                                <FormLabel htmlFor={quantityId} fontSize="xs" mb={1}>
                                    <FormattedMessage {...messages.quantityLabel} />
                                </FormLabel>
                                <QuantityField
                                    id={quantityId}
                                    value={row.quantity}
                                    max={max}
                                    onChange={onQuantityChange}
                                    ariaLabel={intl.formatMessage(messages.quantityLabel)}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel htmlFor={reasonId} fontSize="xs" mb={1}>
                                    <FormattedMessage {...messages.reasonLabel} />
                                </FormLabel>
                                <Select
                                    id={reasonId}
                                    size="sm"
                                    value={row.reasonCode || ''}
                                    onChange={(e) => onReasonChange(e.target.value)}
                                    placeholder={intl.formatMessage(
                                        messages.selectReasonPlaceholder
                                    )}
                                >
                                    {reasons.map((reason) => (
                                        <option key={reason.reason} value={reason.reason}>
                                            {reason.reason}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </SimpleGrid>
                    )}
                </Stack>
            </HStack>
        </Box>
    )
}
ReturnableItemRow.propTypes = {
    item: PropTypes.object.isRequired,
    row: PropTypes.object,
    reasons: PropTypes.array.isRequired,
    onToggle: PropTypes.func.isRequired,
    onQuantityChange: PropTypes.func.isRequired,
    onReasonChange: PropTypes.func.isRequired
}

/**
 * Returns the OMS reason code marked `default: true`, or `undefined` if no
 * default exists (defensive — the API guarantees one).
 */
const findDefaultReasonCode = (reasons = []) => reasons.find((r) => r.default)?.reason

const isSelectionValid = (selection, returnableItems) => {
    const selectedRows = Object.entries(selection || {}).filter(([, row]) => row?.checked)
    if (selectedRows.length === 0) return false
    return selectedRows.every(([itemId, row]) => {
        const item = returnableItems.find((i) => i.itemId === itemId)
        const max = item?.omsData?.quantityAvailableToReturn ?? 0
        const qty = Number(row.quantity)
        return Number.isFinite(qty) && qty >= 1 && qty <= max && !!row.reasonCode
    })
}

/**
 * Step 1 of the return flow. Renders as a centered Modal at `md+` and a
 * bottom-sheet Drawer on `base` (per design). Selection state lives in the
 * parent (`order-detail.jsx`) so the wrapper swap on viewport resize doesn't
 * reset what the shopper has chosen.
 *
 * The follow-up review step (W-22821838) is a sibling view inside the same
 * modal stack. This component invokes `onReview(payload)` with the API-shaped
 * `productItems` array when the shopper clicks **Review return**.
 */
const ReturnOrderModal = ({
    isOpen,
    onClose,
    order,
    returnableItems,
    selection,
    onSelectionChange,
    onReview
}) => {
    const isMobile = useBreakpointValue({base: true, md: false})

    const reviewQuery = useOmsMetaData(
        {},
        {
            enabled: isOpen && onClient
        }
    )
    const reasons = reviewQuery.data?.returnReasonCodes || []
    const defaultReasonCode = useMemo(() => findDefaultReasonCode(reasons), [reasons])

    const updateRow = useCallback(
        (itemId, patch) => {
            const next = {...(selection || {})}
            next[itemId] = {...(next[itemId] || {}), ...patch}
            onSelectionChange(next)
        },
        [selection, onSelectionChange]
    )

    const handleToggle = useCallback(
        (item, checked) => {
            const itemId = item.itemId
            const existing = selection?.[itemId]
            updateRow(itemId, {
                checked,
                quantity: existing?.quantity ?? 1,
                reasonCode: existing?.reasonCode || (checked ? defaultReasonCode : undefined)
            })
        },
        [selection, updateRow, defaultReasonCode]
    )

    const handleQuantityChange = useCallback(
        (itemId, qty) => {
            updateRow(itemId, {quantity: qty})
        },
        [updateRow]
    )

    const handleReasonChange = useCallback(
        (itemId, reasonCode) => {
            updateRow(itemId, {reasonCode})
        },
        [updateRow]
    )

    // Once reasons load, retro-fill default reason on already-checked rows
    // that lacked a reasonCode (e.g. modal opened before metadata resolved).
    const didBackfillRef = useRef(false)
    useEffect(() => {
        if (!isOpen) {
            didBackfillRef.current = false
            return
        }
        if (didBackfillRef.current || !defaultReasonCode || !selection) return
        let next = selection
        let changed = false
        Object.entries(selection).forEach(([itemId, row]) => {
            if (row?.checked && !row.reasonCode) {
                if (!changed) {
                    next = {...selection}
                    changed = true
                }
                next[itemId] = {...row, reasonCode: defaultReasonCode}
            }
        })
        if (changed) onSelectionChange(next)
        didBackfillRef.current = true
    }, [isOpen, defaultReasonCode, selection, onSelectionChange])

    const reviewEnabled = useMemo(
        () => isSelectionValid(selection, returnableItems),
        [selection, returnableItems]
    )

    const handleReview = useCallback(() => {
        const payload = buildReturnPayload(selection, defaultReasonCode)
        onReview(payload)
    }, [selection, defaultReasonCode, onReview])

    const reviewDisabledHintId = 'return-order-modal-review-disabled-hint'

    const body = reviewQuery.isLoading ? (
        <Stack spacing={3} data-testid="return-modal-loading">
            <Skeleton h="64px" />
            <Skeleton h="64px" />
        </Stack>
    ) : reviewQuery.isError ? (
        <Alert status="error" data-testid="return-modal-error">
            <AlertIcon />
            <Stack spacing={2}>
                <AlertDescription>
                    <FormattedMessage {...messages.reasonsError} />
                </AlertDescription>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reviewQuery.refetch()}
                    data-testid="return-modal-retry"
                >
                    <FormattedMessage {...messages.retryButton} />
                </Button>
            </Stack>
        </Alert>
    ) : (
        <Stack spacing={3}>
            {returnableItems.map((item) => (
                <ReturnableItemRow
                    key={item.itemId}
                    item={item}
                    row={selection?.[item.itemId]}
                    reasons={reasons}
                    onToggle={(checked) => handleToggle(item, checked)}
                    onQuantityChange={(qty) => handleQuantityChange(item.itemId, qty)}
                    onReasonChange={(code) => handleReasonChange(item.itemId, code)}
                />
            ))}
        </Stack>
    )

    const header = (
        <Stack spacing={1}>
            <Text fontSize="lg" fontWeight="bold">
                <FormattedMessage {...messages.title} values={{orderNo: order?.orderNo}} />
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="normal">
                <FormattedMessage {...messages.subhead} />
            </Text>
        </Stack>
    )

    const footer = (
        <Stack
            direction={{base: 'column-reverse', md: 'row'}}
            spacing={3}
            width={{base: 'full', md: 'auto'}}
            justifyContent="flex-end"
        >
            <Button
                variant="outline"
                onClick={onClose}
                width={{base: 'full', md: 'auto'}}
                data-testid="return-modal-cancel"
            >
                <FormattedMessage {...messages.cancelButton} />
            </Button>
            <Button
                colorScheme="blue"
                onClick={handleReview}
                isDisabled={!reviewEnabled}
                aria-describedby={reviewEnabled ? undefined : reviewDisabledHintId}
                width={{base: 'full', md: 'auto'}}
                data-testid="return-modal-review"
            >
                <FormattedMessage {...messages.reviewButton} />
            </Button>
            <VisuallyHidden id={reviewDisabledHintId}>
                <FormattedMessage {...messages.reviewDisabledHint} />
            </VisuallyHidden>
        </Stack>
    )

    if (isMobile) {
        return (
            <Drawer isOpen={isOpen} onClose={onClose} placement="bottom" size="full">
                <DrawerOverlay />
                <DrawerContent data-testid="return-order-modal-drawer">
                    <DrawerHeader pb={1}>{header}</DrawerHeader>
                    <DrawerCloseButton />
                    <DrawerBody pt={2}>{body}</DrawerBody>
                    <DrawerFooter>{footer}</DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent data-testid="return-order-modal">
                <ModalHeader pb={1}>{header}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pt={2}>{body}</ModalBody>
                <ModalFooter>{footer}</ModalFooter>
            </ModalContent>
        </Modal>
    )
}

ReturnOrderModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    order: PropTypes.object,
    returnableItems: PropTypes.array.isRequired,
    selection: PropTypes.object,
    onSelectionChange: PropTypes.func.isRequired,
    onReview: PropTypes.func.isRequired
}

export default ReturnOrderModal
