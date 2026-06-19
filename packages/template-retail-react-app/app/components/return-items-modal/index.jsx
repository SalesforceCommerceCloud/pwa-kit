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
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'
import {getDisplayVariationValues} from '@salesforce/retail-react-app/app/utils/product-utils'
import {
    messages,
    buildReturnProductItems
} from '@salesforce/retail-react-app/app/components/return-items-modal/constants'

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

const ReturnableItemRow = React.memo(function ReturnableItemRow({
    item,
    row,
    reasons,
    onToggle,
    onQuantityChange,
    onReasonChange
}) {
    const intl = useIntl()
    const checkboxId = useId()
    const quantityId = useId()
    const reasonId = useId()
    const max = item.omsData?.quantityAvailableToReturn ?? 1
    const variation = formatVariationSummary(item)
    const displayName = variation ? `${item.productName} — ${variation}` : item.productName || ''
    const itemId = item.itemId

    const handleCheckboxChange = useCallback(
        (e) => onToggle(item, e.target.checked),
        [onToggle, item]
    )
    const handleQuantityPickerChange = useCallback(
        (_str, num) => {
            if (Number.isFinite(num)) onQuantityChange(itemId, num)
        },
        [onQuantityChange, itemId]
    )
    const handleReasonSelectChange = useCallback(
        (e) => onReasonChange(itemId, e.target.value),
        [onReasonChange, itemId]
    )

    return (
        <Box
            p={4}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="base"
            data-testid="return-items-modal-item-row"
        >
            <HStack alignItems="flex-start" spacing={3}>
                <Checkbox
                    id={checkboxId}
                    isChecked={!!row?.checked}
                    onChange={handleCheckboxChange}
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
                            <FormControl id={quantityId}>
                                <FormLabel fontSize="xs" mb={1}>
                                    <FormattedMessage {...messages.quantityLabel} />
                                </FormLabel>
                                <QuantityPicker
                                    value={row.quantity}
                                    min={1}
                                    max={max}
                                    step={1}
                                    clampValueOnBlur={true}
                                    precision={0}
                                    onChange={handleQuantityPickerChange}
                                    productName={displayName}
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
                                    onChange={handleReasonSelectChange}
                                    aria-label={intl.formatMessage(messages.reasonFor, {
                                        name: displayName
                                    })}
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
})
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
const ReturnItemsModal = ({
    isOpen,
    onClose,
    order,
    returnableItems,
    selection,
    onSelectionChange,
    onReview
}) => {
    const isMobile = useBreakpointValue({base: true, md: false})
    const reviewDisabledHintId = useId()

    const reviewQuery = useOmsMetaData(
        {},
        {
            enabled: isOpen && onClient
        }
    )
    const reasons = reviewQuery.data?.returnReasonCodes || []
    const defaultReasonCode = useMemo(() => findDefaultReasonCode(reasons), [reasons])

    // Functional updater so two toggles dispatched in the same React batch
    // both observe the latest selection. Closing over `selection` would cause
    // the second update to spread a stale object and clobber the first.
    const updateRow = useCallback(
        (itemId, patch) => {
            onSelectionChange((prev) => ({
                ...(prev || {}),
                [itemId]: {...((prev || {})[itemId] || {}), ...patch}
            }))
        },
        [onSelectionChange]
    )

    const handleToggle = useCallback(
        (item, checked) => {
            const itemId = item.itemId
            onSelectionChange((prev) => {
                const existing = (prev || {})[itemId]
                return {
                    ...(prev || {}),
                    [itemId]: {
                        checked,
                        quantity: existing?.quantity ?? 1,
                        reasonCode:
                            existing?.reasonCode || (checked ? defaultReasonCode : undefined)
                    }
                }
            })
        },
        [onSelectionChange, defaultReasonCode]
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
        const payload = buildReturnProductItems(selection, defaultReasonCode)
        onReview(payload)
    }, [selection, defaultReasonCode, onReview])

    const body = reviewQuery.isLoading ? (
        <Stack spacing={3} data-testid="return-items-modal-loading" role="status">
            <VisuallyHidden>
                <FormattedMessage {...messages.loadingReasons} />
            </VisuallyHidden>
            <Skeleton h="64px" />
            <Skeleton h="64px" />
        </Stack>
    ) : reviewQuery.isError ? (
        <Alert status="error" data-testid="return-items-modal-error">
            <AlertIcon />
            <Stack spacing={2}>
                <AlertDescription>
                    <FormattedMessage {...messages.reasonsError} />
                </AlertDescription>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reviewQuery.refetch()}
                    data-testid="return-items-modal-retry"
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
                    onToggle={handleToggle}
                    onQuantityChange={handleQuantityChange}
                    onReasonChange={handleReasonChange}
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
                data-testid="return-items-modal-cancel"
            >
                <FormattedMessage {...messages.cancelButton} />
            </Button>
            <Button
                colorScheme="blue"
                onClick={handleReview}
                isDisabled={!reviewEnabled}
                aria-describedby={reviewEnabled ? undefined : reviewDisabledHintId}
                width={{base: 'full', md: 'auto'}}
                data-testid="return-items-modal-review"
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
                <DrawerContent data-testid="return-items-modal-drawer">
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
            <ModalContent data-testid="return-items-modal">
                <ModalHeader pb={1}>{header}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pt={2}>{body}</ModalBody>
                <ModalFooter>{footer}</ModalFooter>
            </ModalContent>
        </Modal>
    )
}

ReturnItemsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    order: PropTypes.object,
    returnableItems: PropTypes.array.isRequired,
    selection: PropTypes.object,
    onSelectionChange: PropTypes.func.isRequired,
    onReview: PropTypes.func.isRequired
}

export default ReturnItemsModal
