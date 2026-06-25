/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
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
import Link from '@salesforce/retail-react-app/app/components/link'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'
import {getDisplayVariationValues} from '@salesforce/retail-react-app/app/utils/product-utils'
import {buildReturnProductItems} from '@salesforce/retail-react-app/app/utils/return-utils'
import {ReturnErrorKind} from '@salesforce/retail-react-app/app/utils/return-error-utils'
import {messages} from '@salesforce/retail-react-app/app/components/return-items-modal/constants'

const onClient = typeof window !== 'undefined'

// Error kinds whose recovery requires the shopper to change their selection, so
// the modal drops back to the select view and shows a banner there. Everything
// else (network/unknown) is a same-payload retry shown inline on the review view.
const SELECT_VIEW_ERROR_KINDS = new Set([
    ReturnErrorKind.INVALID_REASON,
    ReturnErrorKind.UNKNOWN_ITEMS,
    ReturnErrorKind.QUANTITY_EXCEEDED
])

// Terminal error kinds: the order can't be returned (404 not found / 409
// conflict), so retrying the same payload is futile. The modal stays open and
// shows a banner with a recovery link (navigate away) instead of a Retry — it
// no longer closes the modal or writes a banner onto the order-detail page.
const TERMINAL_ERROR_KINDS = new Set([ReturnErrorKind.NOT_FOUND, ReturnErrorKind.CONFLICT])

// Inline (review-view) retry messages, keyed by kind. Only network/unknown land
// here; the select-view kinds render their own banner (see selectErrorBanner).
const INLINE_ERROR_MESSAGE = {
    [ReturnErrorKind.NETWORK]: messages.submitErrorNetwork,
    [ReturnErrorKind.UNKNOWN]: messages.submitError
}

/**
 * Normalize the `submitError` prop into `{kind, affectedItemIds}`.
 *
 * The parent (WI-5) passes a classified `{kind, ...}` object, but for backward
 * compatibility (WI-4 callers / existing tests) a raw `Error` is also accepted
 * and treated as the generic `unknown` kind.
 */
const normalizeSubmitError = (submitError) => {
    if (!submitError) return null
    if (typeof submitError === 'object' && typeof submitError.kind === 'string') {
        return {kind: submitError.kind, affectedItemIds: submitError.affectedItemIds || []}
    }
    return {kind: ReturnErrorKind.UNKNOWN, affectedItemIds: []}
}

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
 * The two-step return flow. Renders as a centered Modal at `md+` and a
 * bottom-sheet Drawer on `base` (per design). Selection state lives in the
 * parent (`order-detail.jsx`) so the wrapper swap on viewport resize doesn't
 * reset what the shopper has chosen.
 *
 * The review step (W-22821838) is a second view *inside the same* Modal/Drawer
 * shell, swapped via local `view` state so the Chakra dialog never remounts and
 * the focus trap survives the transition. **Review return** advances to the
 * review view; **Back** returns to selection with all state preserved; **Submit
 * return** invokes `onSubmit(payload)` with the API-shaped `productItems` array.
 * The parent owns the `returnOmsOrder` mutation and feeds `isSubmitting` /
 * `submitError` back in.
 */
const ReturnItemsModal = ({
    isOpen,
    onClose,
    order,
    returnableItems,
    selection,
    onSelectionChange,
    onSubmit,
    onClearSubmitError,
    isSubmitting = false,
    submitError = null,
    finalFocusRef
}) => {
    const intl = useIntl()
    const isMobile = useBreakpointValue({base: true, md: false})
    const reviewDisabledHintId = useId()

    // 'select' (step 1) | 'review' (step 2). Lives locally so the same Chakra
    // shell swaps its inner header/body/footer without remounting.
    const [view, setView] = useState('select')
    // Headings to move focus to on each view swap (a11y: announce the change).
    const selectHeadingRef = useRef(null)
    const reviewHeadingRef = useRef(null)

    // Reopening the modal always starts at the selection view.
    useEffect(() => {
        if (!isOpen) setView('select')
    }, [isOpen])

    const reviewQuery = useOmsMetaData(
        {},
        {
            enabled: isOpen && onClient
        }
    )
    const reasons = reviewQuery.data?.returnReasonCodes || []
    const defaultReasonCode = useMemo(() => findDefaultReasonCode(reasons), [reasons])

    // Clear a stale submit error the moment the shopper edits their selection,
    // so a now-irrelevant error banner doesn't linger over changed inputs.
    // Called from every edit handler below (not just Back).
    const clearStaleSubmitError = useCallback(() => {
        if (submitError) onClearSubmitError?.()
    }, [submitError, onClearSubmitError])

    // Functional updater so two toggles dispatched in the same React batch
    // both observe the latest selection. Closing over `selection` would cause
    // the second update to spread a stale object and clobber the first.
    const updateRow = useCallback(
        (itemId, patch) => {
            clearStaleSubmitError()
            onSelectionChange((prev) => ({
                ...(prev || {}),
                [itemId]: {...((prev || {})[itemId] || {}), ...patch}
            }))
        },
        [onSelectionChange, clearStaleSubmitError]
    )

    const handleToggle = useCallback(
        (item, checked) => {
            const itemId = item.itemId
            clearStaleSubmitError()
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
        [onSelectionChange, defaultReasonCode, clearStaleSubmitError]
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

    // Classify the parent-supplied submit error (tolerating a raw Error).
    const normalizedError = useMemo(() => normalizeSubmitError(submitError), [submitError])

    // Recovery side effects driven by the error kind:
    //  - select-view kinds (invalid reason / unknown items / quantity exceeded)
    //    require editing the selection, so drop back to the select view where the
    //    rows (and the new banner) live.
    //  - invalid reason additionally repopulates the reason dropdowns from OMS.
    // Guarded on the error identity so it fires once per new error, not every render.
    const handledErrorRef = useRef(null)
    useEffect(() => {
        if (!submitError || handledErrorRef.current === submitError) return
        handledErrorRef.current = submitError
        const kind = normalizedError?.kind
        if (kind && SELECT_VIEW_ERROR_KINDS.has(kind)) {
            setView('select')
        }
        if (kind === ReturnErrorKind.INVALID_REASON) {
            // The picked reason is no longer valid. Refetch the reason list AND
            // clear the stale reasonCode on every checked row, so the shopper
            // can't simply re-review/resubmit the same rejected reason (the
            // Review button stays disabled until a fresh reason is chosen).
            reviewQuery.refetch?.()
            onSelectionChange((prev) => {
                if (!prev) return prev
                let next = prev
                let changed = false
                Object.entries(prev).forEach(([itemId, row]) => {
                    if (row?.checked && row.reasonCode) {
                        if (!changed) {
                            next = {...prev}
                            changed = true
                        }
                        next[itemId] = {...row, reasonCode: undefined}
                    }
                })
                return changed ? next : prev
            })
        }
    }, [submitError, normalizedError, reviewQuery, onSelectionChange])
    useEffect(() => {
        if (!submitError) handledErrorRef.current = null
    }, [submitError])

    // No-op when the selection is invalid: the Review button stays in the tab
    // order via aria-disabled (so keyboard/SR users can focus it and hear the
    // aria-describedby hint), which means the click handler must guard itself
    // rather than relying on a native `disabled` attribute.
    const handleReview = useCallback(() => {
        if (!reviewEnabled) return
        setView('review')
    }, [reviewEnabled])
    // Going Back to edit clears any prior submit error so a stale message can't
    // reappear on the review view before the next submit fires.
    const handleBack = useCallback(() => {
        if (submitError) onClearSubmitError?.()
        setView('select')
    }, [submitError, onClearSubmitError])

    // Guard against a double-fire: the parent's `isSubmitting` only flips true
    // after it re-renders, so two clicks dispatched in the same tick would both
    // pass the prop check. The ref latches synchronously on the first click and
    // releases once the request settles (isSubmitting falls back to false) or
    // the modal closes.
    const submitInFlightRef = useRef(false)
    useEffect(() => {
        if (!isSubmitting) submitInFlightRef.current = false
    }, [isSubmitting])
    useEffect(() => {
        if (!isOpen) submitInFlightRef.current = false
    }, [isOpen])
    // A reported error settles the in-flight request too, so Retry can re-fire
    // even when the parent's `isSubmitting` flag never toggled (e.g. a
    // synchronous rejection that resolves within the same render).
    useEffect(() => {
        if (submitError) submitInFlightRef.current = false
    }, [submitError])

    const handleSubmit = useCallback(() => {
        if (isSubmitting || submitInFlightRef.current) return
        submitInFlightRef.current = true
        const payload = buildReturnProductItems(selection, defaultReasonCode)
        onSubmit(payload)
    }, [isSubmitting, selection, defaultReasonCode, onSubmit])

    // Move focus to the active view's heading on swap so screen readers know
    // the content changed (forward to review and back to selection).
    useEffect(() => {
        if (!isOpen) return
        const target = view === 'review' ? reviewHeadingRef.current : selectHeadingRef.current
        target?.focus()
    }, [view, isOpen])

    // Resolve the human-readable label for the picked reason code. OMS
    // `returnReasonCodes` entries are `{reason, default}` — `reason` is both the
    // code and the display text — so we match on it and fall back to the raw
    // code (never the default; that would misstate the shopper's choice).
    const reviewRows = useMemo(() => {
        if (view !== 'review') return []
        return Object.entries(selection || {})
            .filter(([, row]) => row?.checked)
            .map(([itemId, row]) => {
                const item = returnableItems.find((i) => i.itemId === itemId)
                const variation = item ? formatVariationSummary(item) : ''
                const displayName = item
                    ? variation
                        ? `${item.productName} — ${variation}`
                        : item.productName || ''
                    : itemId
                const reasonLabel =
                    reasons.find((r) => r.reason === row.reasonCode)?.reason || row.reasonCode
                return {itemId, displayName, quantity: row.quantity, reasonLabel}
            })
    }, [view, selection, returnableItems, reasons])

    // Map affected item ids -> display names for the quantity-exceeded banner.
    const affectedItemNames = useMemo(() => {
        const ids = normalizedError?.affectedItemIds || []
        if (!ids.length) return []
        return ids.map((id) => {
            const item = returnableItems.find((i) => i.itemId === id)
            if (!item) return id
            const variation = formatVariationSummary(item)
            return variation ? `${item.productName} — ${variation}` : item.productName || id
        })
    }, [normalizedError, returnableItems])

    // Select-view error banner: rendered above the rows when the error kind
    // requires editing the selection (invalid reason / unknown items / quantity
    // exceeded). role="alert" matches the inline review-view alert convention.
    const selectErrorBanner =
        normalizedError && SELECT_VIEW_ERROR_KINDS.has(normalizedError.kind) ? (
            <Alert status="error" role="alert" data-testid="return-items-modal-select-error">
                <AlertIcon />
                <AlertDescription>
                    {normalizedError.kind === ReturnErrorKind.INVALID_REASON ? (
                        <FormattedMessage {...messages.submitErrorInvalidReason} />
                    ) : normalizedError.kind === ReturnErrorKind.UNKNOWN_ITEMS ? (
                        <FormattedMessage {...messages.submitErrorUnknownItems} />
                    ) : affectedItemNames.length ? (
                        <FormattedMessage
                            {...messages.quantityExceededAffected}
                            // Locale-aware list join (e.g. "A, B, and C" in en;
                            // localized separators/conjunctions elsewhere).
                            values={{
                                items: intl.formatList(affectedItemNames, {type: 'conjunction'})
                            }}
                        />
                    ) : (
                        <FormattedMessage {...messages.quantityExceededAffectedGeneric} />
                    )}
                </AlertDescription>
            </Alert>
        ) : null

    const selectBody = reviewQuery.isLoading ? (
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
            {selectErrorBanner}
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

    // Terminal error banner (404/409): the order can't be returned, so there's no
    // Retry. The 404 ("order not found") offers a recovery link back to order
    // history (a real route). The 409 ("can't be returned right now") has no valid
    // self-service destination, so — mirroring the cancel flow — it points shoppers
    // to the merchant in text only, rather than linking to a route that doesn't
    // exist. Submitted from the review view, so it renders there. role="alert"
    // announces it like the other banners.
    const isTerminalError = !!normalizedError && TERMINAL_ERROR_KINDS.has(normalizedError.kind)
    const isNotFound = normalizedError?.kind === ReturnErrorKind.NOT_FOUND
    const terminalErrorBanner = isTerminalError ? (
        <Alert status="error" role="alert" data-testid="return-items-modal-terminal-error">
            <AlertIcon />
            <Stack spacing={2}>
                <AlertDescription fontWeight="semibold">
                    <FormattedMessage {...messages.terminalErrorTitle} />
                </AlertDescription>
                <AlertDescription>
                    {isNotFound ? (
                        <FormattedMessage {...messages.terminalErrorNotFound} />
                    ) : (
                        <FormattedMessage {...messages.terminalErrorConflict} />
                    )}
                </AlertDescription>
                {isNotFound && (
                    <Button
                        as={Link}
                        to="/account/orders"
                        variant="link"
                        size="sm"
                        data-testid="return-items-modal-terminal-link"
                    >
                        <FormattedMessage {...messages.terminalLinkOrders} />
                    </Button>
                )}
            </Stack>
        </Alert>
    ) : null

    // Inline review-view error: only the same-payload-retry kinds (network /
    // unknown) render here. The select-view kinds switch views (see the effect
    // above) and render their banner on the select view; terminal kinds render
    // their own no-retry banner (above) instead.
    const showInlineReviewError =
        normalizedError &&
        !SELECT_VIEW_ERROR_KINDS.has(normalizedError.kind) &&
        !TERMINAL_ERROR_KINDS.has(normalizedError.kind)
    const inlineErrorMessage = INLINE_ERROR_MESSAGE[normalizedError?.kind] || messages.submitError

    const reviewBody = (
        <Stack spacing={3}>
            {terminalErrorBanner}
            {showInlineReviewError && (
                <Alert status="error" role="alert" data-testid="return-items-modal-submit-error">
                    <AlertIcon />
                    <Stack spacing={2}>
                        <AlertDescription>
                            <FormattedMessage {...inlineErrorMessage} />
                        </AlertDescription>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSubmit}
                            isDisabled={isSubmitting}
                            data-testid="return-items-modal-submit-retry"
                        >
                            <FormattedMessage {...messages.retryButton} />
                        </Button>
                    </Stack>
                </Alert>
            )}
            {reviewRows.map((row) => (
                <Box
                    key={row.itemId}
                    p={4}
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="base"
                    data-testid="return-items-modal-review-row"
                >
                    <Stack spacing={1}>
                        <Text fontSize="sm" fontWeight="semibold">
                            {row.displayName}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                            <FormattedMessage
                                {...messages.reviewQuantity}
                                values={{count: row.quantity}}
                            />
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                            <FormattedMessage
                                {...messages.reviewReason}
                                values={{reason: row.reasonLabel}}
                            />
                        </Text>
                    </Stack>
                </Box>
            ))}
        </Stack>
    )

    const selectHeader = (
        <Stack spacing={1}>
            <Text
                ref={selectHeadingRef}
                tabIndex={-1}
                fontSize="lg"
                fontWeight="bold"
                _focus={{outline: 'none'}}
            >
                <FormattedMessage {...messages.title} values={{orderNo: order?.orderNo}} />
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="normal">
                <FormattedMessage {...messages.subhead} />
            </Text>
        </Stack>
    )

    const reviewHeader = (
        <Stack spacing={1}>
            <Text
                ref={reviewHeadingRef}
                tabIndex={-1}
                fontSize="lg"
                fontWeight="bold"
                _focus={{outline: 'none'}}
            >
                <FormattedMessage {...messages.reviewTitle} />
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="normal">
                <FormattedMessage {...messages.reviewSubhead} />
            </Text>
        </Stack>
    )

    const selectFooter = (
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
                // Use aria-disabled (not isDisabled) so the button stays in the
                // tab order while invalid — a native `disabled` button can't be
                // focused, so a keyboard/SR user would never hear the
                // aria-describedby hint explaining why it's disabled. Chakra's
                // `_disabled` styles still apply (the pseudo matches
                // [aria-disabled=true]); handleReview no-ops when invalid.
                aria-disabled={!reviewEnabled}
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

    const reviewFooter = (
        <Stack
            direction={{base: 'column-reverse', md: 'row'}}
            spacing={3}
            width={{base: 'full', md: 'auto'}}
            justifyContent="flex-end"
        >
            <Button
                variant="outline"
                onClick={handleBack}
                isDisabled={isSubmitting}
                width={{base: 'full', md: 'auto'}}
                data-testid="return-items-modal-back"
            >
                <FormattedMessage {...messages.backButton} />
            </Button>
            <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                // A terminal error (404/409) can't be resolved by resubmitting, so
                // disable Submit and let the banner's recovery link be the only path.
                isDisabled={isSubmitting || isTerminalError}
                aria-busy={isSubmitting}
                width={{base: 'full', md: 'auto'}}
                data-testid="return-items-modal-submit"
            >
                <FormattedMessage {...messages.submitButton} />
            </Button>
        </Stack>
    )

    const isReview = view === 'review'
    const header = isReview ? reviewHeader : selectHeader
    const body = isReview ? reviewBody : selectBody
    const footer = isReview ? reviewFooter : selectFooter

    if (isMobile) {
        return (
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                placement="bottom"
                size="full"
                finalFocusRef={finalFocusRef}
            >
                <DrawerOverlay />
                <DrawerContent data-testid="return-items-modal-drawer">
                    <DrawerHeader pb={1}>{header}</DrawerHeader>
                    <DrawerCloseButton />
                    {/* No body-level aria-live: view swaps are announced by moving
                        focus to the new heading, and errors carry their own
                        role="alert", so a polite region here would only add a
                        redundant whole-body re-announcement. */}
                    <DrawerBody pt={2}>{body}</DrawerBody>
                    <DrawerFooter>{footer}</DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            isCentered
            scrollBehavior="inside"
            finalFocusRef={finalFocusRef}
        >
            <ModalOverlay />
            <ModalContent data-testid="return-items-modal">
                <ModalHeader pb={1}>{header}</ModalHeader>
                <ModalCloseButton />
                {/* No body-level aria-live: view swaps are announced by moving
                    focus to the new heading, and errors carry their own
                    role="alert", so a polite region here would only add a
                    redundant whole-body re-announcement. */}
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
    /** Invoked with the API-shaped `productItems` array when the shopper submits. */
    onSubmit: PropTypes.func.isRequired,
    /** Invoked to clear a stale submit error when the shopper edits their selection (Back). */
    onClearSubmitError: PropTypes.func,
    /** True while the parent's `returnOmsOrder` mutation is in flight. */
    isSubmitting: PropTypes.bool,
    /**
     * Truthy when the submit failed. Preferred shape is the classified object
     * `{kind, affectedItemIds}` from `classifyReturnError`; a raw `Error` is
     * also accepted (treated as the generic `unknown` kind) for back-compat.
     * Drives the inline review-view retry (network/unknown) or the select-view
     * banner (invalid reason / unknown items / quantity exceeded).
     */
    submitError: PropTypes.oneOfType([
        PropTypes.instanceOf(Error),
        PropTypes.shape({
            kind: PropTypes.string,
            affectedItemIds: PropTypes.arrayOf(PropTypes.string)
        })
    ]),
    /** Element to receive focus when the modal closes (stable across the post-success refetch). */
    finalFocusRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
}

export default ReturnItemsModal
