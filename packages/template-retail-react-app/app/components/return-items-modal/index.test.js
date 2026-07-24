/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {act, fireEvent, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useBreakpointValue} from '@salesforce/retail-react-app/app/components/shared/ui'
import ReturnItemsModal from '@salesforce/retail-react-app/app/components/return-items-modal'
import {ReturnErrorKind} from '@salesforce/retail-react-app/app/utils/return-error-utils'

// Mock only useBreakpointValue so we can drive the desktop Modal vs. mobile
// Drawer branch deterministically; everything else stays the real component.
// Default (undefined) is falsy → desktop Modal, matching the suite's default.
jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => {
    const originalModule = jest.requireActual(
        '@salesforce/retail-react-app/app/components/shared/ui'
    )
    return {
        ...originalModule,
        useBreakpointValue: jest.fn()
    }
})

const defaultReasonCodes = [
    {reason: 'Wrong size', default: true},
    {reason: 'Defect', default: false},
    {reason: 'Changed my mind', default: false}
]

const baseOrder = {
    orderNo: '00123456',
    productItems: [
        {
            itemId: 'item-1',
            productId: 'prod-1',
            productName: 'Cotton Crew T-Shirt',
            quantity: 2,
            omsData: {quantityAvailableToReturn: 2},
            variationAttributes: [
                {id: 'color', name: 'Color', values: [{value: 'BLACK', name: 'Black'}]},
                {id: 'size', name: 'Size', values: [{value: 'M', name: 'M'}]}
            ],
            variationValues: {color: 'BLACK', size: 'M'}
        },
        {
            itemId: 'item-2',
            productId: 'prod-2',
            productName: 'Slim Fit Chino Pants',
            quantity: 1,
            omsData: {quantityAvailableToReturn: 1}
        }
    ]
}

const Harness = ({
    onSubmit = jest.fn(),
    onClose = jest.fn(),
    onClearSubmitError = jest.fn(),
    onRefetchReasons = jest.fn(),
    reasonCodes = defaultReasonCodes,
    initialSelection = {},
    isSubmitting = false,
    submitError = null,
    finalFocusRef
} = {}) => {
    const [selection, setSelection] = useState(initialSelection)
    return (
        <ReturnItemsModal
            isOpen={true}
            onClose={onClose}
            order={baseOrder}
            returnableItems={baseOrder.productItems}
            reasonCodes={reasonCodes}
            selection={selection}
            onSelectionChange={setSelection}
            onSubmit={onSubmit}
            onClearSubmitError={onClearSubmitError}
            onRefetchReasons={onRefetchReasons}
            isSubmitting={isSubmitting}
            submitError={submitError}
            finalFocusRef={finalFocusRef}
        />
    )
}
Harness.propTypes = {
    onSubmit: PropTypes.func,
    onClose: PropTypes.func,
    onClearSubmitError: PropTypes.func,
    onRefetchReasons: PropTypes.func,
    reasonCodes: PropTypes.array,
    initialSelection: PropTypes.object,
    isSubmitting: PropTypes.bool,
    submitError: PropTypes.any,
    finalFocusRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
}

afterEach(() => {
    jest.clearAllMocks()
    // clearAllMocks wipes the implementation too; restore the default
    // (undefined → desktop Modal branch) so order-independent tests are stable.
    useBreakpointValue.mockReturnValue(undefined)
})

test('renders header with order number and a row per returnable item', async () => {
    renderWithProviders(<Harness />)
    expect(await screen.findByText(/return items from order #00123456/i)).toBeInTheDocument()
    expect(screen.getByText(/select the items you want to return/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('return-items-modal-item-row')).toHaveLength(2)
    expect(screen.getByText(/cotton crew t-shirt/i)).toBeInTheDocument()
    expect(screen.getByText(/slim fit chino pants/i)).toBeInTheDocument()
})

test('Review return is disabled until at least one valid row is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const reviewButton = screen.getByTestId('return-items-modal-review')
    // Disabled via aria-disabled (not the native disabled attribute) so the
    // button stays focusable and keyboard/SR users can reach the hint.
    expect(reviewButton).toHaveAttribute('aria-disabled', 'true')
    expect(reviewButton).not.toHaveAttribute('disabled')
    // The disabled-reason hint must be reachable via aria-describedby.
    expect(reviewButton).toHaveAttribute('aria-describedby')

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(reviewButton).toHaveAttribute('aria-disabled', 'false')
    expect(reviewButton).not.toHaveAttribute('aria-describedby')
})

test('clicking the disabled Review button does not advance to the review view', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    // aria-disabled keeps the button clickable in the DOM, so the handler must
    // no-op while the selection is invalid — otherwise a keyboard/SR user who
    // focuses and activates it would skip to an empty review.
    await user.click(screen.getByTestId('return-items-modal-review'))
    expect(screen.queryByText(/review your return/i)).not.toBeInTheDocument()
})

test('toggling a row expands it and pre-selects the OMS default reason', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    const row = screen.getAllByTestId('return-items-modal-item-row')[0]
    // Reason carries a per-row aria-label (so screen readers can distinguish
    // the dropdowns). Quantity reuses the shared QuantityPicker which sets
    // aria-label="Quantity"; we scope to the row + the input element to
    // disambiguate from the +/- buttons.
    expect(within(row).getByLabelText(/reason for /i, {selector: 'select'})).toHaveValue(
        'Wrong size'
    )
    expect(within(row).getByLabelText(/^quantity$/i, {selector: 'input'})).toHaveValue('1')
})

test('when reasons are unavailable the dropdown is hidden and the shopper can still proceed (cancel-flow parity)', async () => {
    // Empty array is the shape the modal sees when the page's useOmsMetaData
    // failed (data is undefined → returnReasonCodes is undefined → reasons=[]).
    // Reason is optional per the OMS return API; the server backfills the
    // default when omitted, so we mirror CancelOrderModal and let the shopper
    // proceed without a reason dropdown.
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    renderWithProviders(<Harness reasonCodes={[]} onSubmit={onSubmit} />)

    // No banner rendered — cancel flow makes reasons-missing silent-graceful.
    expect(screen.queryByTestId('return-items-modal-reasons-unavailable')).not.toBeInTheDocument()

    // Check a row. The Reason dropdown for the row is not rendered at all.
    await user.click(screen.getAllByRole('checkbox')[0])
    const row = screen.getAllByTestId('return-items-modal-item-row')[0]
    expect(within(row).queryByLabelText(/reason for /i, {selector: 'select'})).toBeNull()

    // Review Return is enabled: reason is optional, so a checked row with a
    // valid quantity is a valid selection.
    const review = screen.getByTestId('return-items-modal-review')
    expect(review).toHaveAttribute('aria-disabled', 'false')
    await user.click(review)
    expect(await screen.findByText(/review your return/i)).toBeInTheDocument()

    // Submit — the outbound payload omits `reason`, so OMS applies the default.
    await user.click(screen.getByTestId('return-items-modal-submit'))
    expect(onSubmit).toHaveBeenCalledWith([{itemId: 'item-1', quantity: 1}])
})

test('quantity field clamps to the available-to-return ceiling', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0]) // item-1 has max 2

    const row = screen.getAllByTestId('return-items-modal-item-row')[0]
    const qty = within(row).getByLabelText(/^quantity$/i, {selector: 'input'})
    // Set value directly then blur — Chakra's useNumberInput clamps on blur,
    // and userEvent.clear() doesn't propagate to a controlled NumberInput
    // because the hook rejects empty intermediate values.
    fireEvent.change(qty, {target: {value: '99'}})
    fireEvent.blur(qty)
    expect(qty).toHaveValue('2')
})

test('Cancel calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    renderWithProviders(<Harness onClose={onClose} />)
    await user.click(screen.getByTestId('return-items-modal-cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
})

test('clicking Review return swaps to the review view with text-only rows', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // item-2: max 1, default reason "Wrong size"

    await user.click(screen.getByTestId('return-items-modal-review'))

    expect(await screen.findByText(/review your return/i)).toBeInTheDocument()
    const rows = screen.getAllByTestId('return-items-modal-review-row')
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByText(/slim fit chino pants/i)).toBeInTheDocument()
    expect(within(rows[0]).getByText(/quantity: 1/i)).toBeInTheDocument()
    expect(within(rows[0]).getByText(/reason: wrong size/i)).toBeInTheDocument()
})

test('Back returns to the selection view with state preserved', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0]) // item-1

    await user.click(screen.getByTestId('return-items-modal-review'))
    expect(await screen.findByTestId('return-items-modal-back')).toBeInTheDocument()

    await user.click(screen.getByTestId('return-items-modal-back'))

    // Back on the selection view, the row is still checked with its values
    expect(await screen.findByTestId('return-items-modal-review')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    const row = screen.getAllByTestId('return-items-modal-item-row')[0]
    expect(within(row).getByLabelText(/reason for /i, {selector: 'select'})).toHaveValue(
        'Wrong size'
    )
})

test('Submit return forwards a properly shaped payload', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    renderWithProviders(<Harness onSubmit={onSubmit} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // item-2: max 1

    // Change reason away from default so it gets serialized
    const reason = within(screen.getAllByTestId('return-items-modal-item-row')[1]).getByLabelText(
        /reason for /i,
        {selector: 'select'}
    )
    await user.selectOptions(reason, 'Defect')

    await user.click(screen.getByTestId('return-items-modal-review'))
    await user.click(await screen.findByTestId('return-items-modal-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload).toEqual([{itemId: 'item-2', quantity: 1, reason: 'Defect'}])
    // quantity must serialize as a JS Number, not a string
    expect(typeof payload[0].quantity).toBe('number')
})

test('Submit omits reason when the shopper kept the OMS default', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    renderWithProviders(<Harness onSubmit={onSubmit} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // item-2, default reason left as-is ("Wrong size")

    await user.click(screen.getByTestId('return-items-modal-review'))
    await user.click(await screen.findByTestId('return-items-modal-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual([{itemId: 'item-2', quantity: 1}])
})

test('Submit fires only once even on a rapid double-click', async () => {
    const onSubmit = jest.fn()
    // isSubmitting=true models the in-flight state the parent flips on first click;
    // the button is disabled, so the second click is a no-op.
    const {rerender} = renderWithProviders(
        <Harness onSubmit={onSubmit} initialSelection={{'item-2': {checked: true, quantity: 1}}} />
    )
    const user = userEvent.setup()
    await user.click(screen.getByTestId('return-items-modal-review'))
    const submit = await screen.findByTestId('return-items-modal-submit')

    act(() => {
        fireEvent.click(submit)
        fireEvent.click(submit)
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)

    // Even after the parent re-renders with isSubmitting, further clicks no-op
    rerender(
        <Harness
            onSubmit={onSubmit}
            isSubmitting={true}
            initialSelection={{'item-2': {checked: true, quantity: 1}}}
        />
    )
})

test('submitError renders an inline alert and the footer Submit re-fires submit', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    renderWithProviders(
        <Harness
            onSubmit={onSubmit}
            submitError={{kind: ReturnErrorKind.UNKNOWN}}
            initialSelection={{'item-2': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await user.click(screen.getByTestId('return-items-modal-review'))

    // The inline banner is informational only — no Retry button. The shopper
    // resubmits from the footer Submit (left enabled for this kind) or closes.
    expect(await screen.findByTestId('return-items-modal-submit-error')).toBeInTheDocument()
    expect(screen.queryByTestId('return-items-modal-submit-retry')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('return-items-modal-submit'))
    expect(onSubmit).toHaveBeenCalledWith([{itemId: 'item-2', quantity: 1, reason: 'Defect'}])
})

// --- error-code-specific rendering ---

test('network error renders the inline review-view banner with network copy', async () => {
    const user = userEvent.setup()
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.NETWORK}}
            initialSelection={{'item-2': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await user.click(screen.getByTestId('return-items-modal-review'))
    const alert = await screen.findByTestId('return-items-modal-submit-error')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute('role', 'alert')
    expect(screen.getByText(/unable to process your request right now/i)).toBeInTheDocument()
    // Informational banner only — no Retry button; Submit stays enabled so the
    // shopper can resubmit from the footer (or close the modal).
    expect(screen.queryByTestId('return-items-modal-submit-retry')).not.toBeInTheDocument()
    expect(screen.getByTestId('return-items-modal-submit')).toBeEnabled()
})

test('unknown error renders the generic inline retry message', async () => {
    const user = userEvent.setup()
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.UNKNOWN}}
            initialSelection={{'item-2': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await user.click(screen.getByTestId('return-items-modal-review'))
    expect(await screen.findByTestId('return-items-modal-submit-error')).toBeInTheDocument()
    expect(screen.getByText(/we couldn't submit your return/i)).toBeInTheDocument()
})

test('notFound terminal error shows a no-link banner and disables Submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.NOT_FOUND}}
            initialSelection={{'item-2': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await user.click(screen.getByTestId('return-items-modal-review'))
    const banner = await screen.findByTestId('return-items-modal-terminal-error')
    expect(banner).toHaveAttribute('role', 'alert')
    expect(within(banner).getByText(/can't find this order/i)).toBeInTheDocument()
    // No recovery link — the shopper closes the modal — and Submit is disabled.
    expect(screen.queryByTestId('return-items-modal-terminal-link')).not.toBeInTheDocument()
    expect(screen.getByTestId('return-items-modal-submit')).toBeDisabled()
})

test('conflict terminal error shows the merchant-contact banner and disables Submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.CONFLICT}}
            initialSelection={{'item-2': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await user.click(screen.getByTestId('return-items-modal-review'))
    const banner = await screen.findByTestId('return-items-modal-terminal-error')
    expect(within(banner).getByText(/reach out to the merchant/i)).toBeInTheDocument()
    expect(screen.queryByTestId('return-items-modal-terminal-link')).not.toBeInTheDocument()
    expect(screen.getByTestId('return-items-modal-submit')).toBeDisabled()
})

test('quantityExceeded error drops to the select view and shows the quantity-changed banner', async () => {
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.QUANTITY_EXCEEDED}}
            initialSelection={{'item-1': {checked: true, quantity: 2, reasonCode: 'Defect'}}}
        />
    )
    // Forced back to select view: the rows (not the review summary) are present.
    expect(await screen.findByTestId('return-items-modal-select-error')).toBeInTheDocument()
    expect(screen.queryByText(/review your return/i)).not.toBeInTheDocument()
    const banner = screen.getByTestId('return-items-modal-select-error')
    expect(banner).toHaveAttribute('role', 'alert')
    // Generic "quantities changed" copy (the API does not name specific items).
    expect(
        within(banner).getByText(/available return quantities for some items changed/i)
    ).toBeInTheDocument()
    // No inline review-view error in this state.
    expect(screen.queryByTestId('return-items-modal-submit-error')).not.toBeInTheDocument()
})

test('unknownItems error drops to the select view with a refresh-and-try-again banner', async () => {
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.UNKNOWN_ITEMS}}
            initialSelection={{'item-1': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    const banner = await screen.findByTestId('return-items-modal-select-error')
    expect(
        within(banner).getByText(/can't find one or more items on this order/i)
    ).toBeInTheDocument()
})

test('invalidReason error shows the select-view banner and refetches OMS reasons', async () => {
    const onRefetchReasons = jest.fn()
    renderWithProviders(
        <Harness
            onRefetchReasons={onRefetchReasons}
            submitError={{kind: ReturnErrorKind.INVALID_REASON}}
            initialSelection={{'item-1': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    const banner = await screen.findByTestId('return-items-modal-select-error')
    expect(within(banner).getByText(/selected reason is no longer available/i)).toBeInTheDocument()
    expect(onRefetchReasons).toHaveBeenCalled()
})

test('invalidReason error clears the stale reasonCode so the same reason cannot be resubmitted', async () => {
    // The rejected reason must not stay selected — otherwise the shopper could
    // immediately re-review/resubmit the same invalid reason. Clearing it drops
    // the row to invalid until a fresh reason is chosen, so Review is disabled.
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.INVALID_REASON}}
            initialSelection={{'item-1': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await screen.findByTestId('return-items-modal-select-error')
    const row = screen.getAllByTestId('return-items-modal-item-row')[0]
    // The reason select is reset to the empty placeholder (no stale "Defect").
    await waitFor(() =>
        expect(within(row).getByLabelText(/reason for /i, {selector: 'select'})).toHaveValue('')
    )
    // With no reason picked, the selection is invalid → Review stays disabled.
    expect(screen.getByTestId('return-items-modal-review')).toHaveAttribute('aria-disabled', 'true')
})

test('editing a row after an error clears the stale submit error (onClearSubmitError)', async () => {
    const user = userEvent.setup()
    const onClearSubmitError = jest.fn()
    renderWithProviders(
        <Harness
            submitError={{kind: ReturnErrorKind.UNKNOWN_ITEMS}}
            onClearSubmitError={onClearSubmitError}
            initialSelection={{'item-1': {checked: true, quantity: 1, reasonCode: 'Defect'}}}
        />
    )
    await screen.findByTestId('return-items-modal-select-error')
    // Toggle item-2 on — an edit to the selection.
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])
    expect(onClearSubmitError).toHaveBeenCalled()
})

test('backfills the OMS default reason on already-checked rows when metadata is available', async () => {
    // Models the case where the parent has a checked row whose reasonCode
    // was never set (e.g. selection rehydrated from URL state in a future
    // WI, or initial open where the user clicked the row before reasons
    // resolved). The modal's mount-time backfill effect must apply the
    // OMS default so the row is valid without forcing a re-pick.
    const initial = {'item-1': {checked: true, quantity: 1, reasonCode: undefined}}

    renderWithProviders(<Harness initialSelection={initial} />)

    await waitFor(() => expect(screen.getByTestId('return-items-modal-review')).toBeEnabled())
    const row = screen.getAllByTestId('return-items-modal-item-row')[0]
    expect(within(row).getByLabelText(/reason for /i, {selector: 'select'})).toHaveValue(
        'Wrong size'
    )
})

test('two toggles in the same React batch both stick (no stale closure)', async () => {
    // Regression: updateRow used to close over `selection`, so two checkbox
    // toggles dispatched in a single render cycle each spread the same stale
    // object — only the second won, silently dropping the first row.
    renderWithProviders(<Harness />)
    const [first, second] = screen.getAllByRole('checkbox')
    act(() => {
        fireEvent.click(first)
        fireEvent.click(second)
    })
    await waitFor(() => expect(first).toBeChecked())
    expect(second).toBeChecked()
})

// Drives the open/close lifecycle from a real trigger so we can assert focus
// returns to it on close (Chakra's finalFocusRef). Mirrors how order-detail.jsx
// passes its heading ref, but a button is the clearer focus target under test.
const FocusHarness = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [selection, setSelection] = useState({})
    const triggerRef = React.useRef(null)
    return (
        <>
            <button
                data-testid="return-items-trigger"
                ref={triggerRef}
                onClick={() => setIsOpen(true)}
            >
                Return Items
            </button>
            <ReturnItemsModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                order={baseOrder}
                returnableItems={baseOrder.productItems}
                reasonCodes={defaultReasonCodes}
                selection={selection}
                onSelectionChange={setSelection}
                onSubmit={jest.fn()}
                finalFocusRef={triggerRef}
            />
        </>
    )
}

test('returns focus to the trigger when the modal closes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FocusHarness />)

    const trigger = screen.getByTestId('return-items-trigger')
    await user.click(trigger)
    expect(await screen.findByTestId('return-items-modal')).toBeInTheDocument()

    await user.click(screen.getByTestId('return-items-modal-cancel'))
    await waitFor(() => expect(screen.queryByTestId('return-items-modal')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
})

test('renders the bottom-sheet Drawer branch on mobile', async () => {
    // base breakpoint → useBreakpointValue returns true → Drawer, not Modal.
    useBreakpointValue.mockReturnValue(true)
    renderWithProviders(<Harness />)

    expect(await screen.findByTestId('return-items-modal-drawer')).toBeInTheDocument()
    expect(screen.queryByTestId('return-items-modal')).not.toBeInTheDocument()
    // Same content + footer actions render inside the Drawer branch.
    expect(screen.getByText(/return items from order #00123456/i)).toBeInTheDocument()
    expect(screen.getByText(/select the items you want to return/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('return-items-modal-item-row')).toHaveLength(2)
    expect(screen.getByTestId('return-items-modal-review')).toBeInTheDocument()
})
