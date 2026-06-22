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

let mockOmsMetaData = {
    data: {
        cancelReasonCodes: [],
        returnReasonCodes: [
            {reason: 'Wrong size', default: true},
            {reason: 'Defect', default: false},
            {reason: 'Changed my mind', default: false}
        ]
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn()
}
jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useOmsMetaData: () => mockOmsMetaData
    }
})

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

const Harness = ({onReview = jest.fn(), onClose = jest.fn(), initialSelection = {}} = {}) => {
    const [selection, setSelection] = useState(initialSelection)
    return (
        <ReturnItemsModal
            isOpen={true}
            onClose={onClose}
            order={baseOrder}
            returnableItems={baseOrder.productItems}
            selection={selection}
            onSelectionChange={setSelection}
            onReview={onReview}
        />
    )
}
Harness.propTypes = {
    onReview: PropTypes.func,
    onClose: PropTypes.func,
    initialSelection: PropTypes.object
}

afterEach(() => {
    mockOmsMetaData = {
        data: {
            cancelReasonCodes: [],
            returnReasonCodes: [
                {reason: 'Wrong size', default: true},
                {reason: 'Defect', default: false},
                {reason: 'Changed my mind', default: false}
            ]
        },
        isLoading: false,
        isError: false,
        refetch: jest.fn()
    }
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
    const onReview = jest.fn()
    renderWithProviders(<Harness onReview={onReview} />)
    const reviewButton = screen.getByTestId('return-items-modal-review')
    // Disabled via aria-disabled (not the native disabled attribute) so the
    // button stays focusable and the hint stays announceable to SR users.
    expect(reviewButton).toHaveAttribute('aria-disabled', 'true')
    expect(reviewButton).not.toHaveAttribute('disabled')
    // The disabled-reason hint must be reachable: aria-describedby points at a
    // node that actually exists in the document and carries the explanation.
    const hintId = reviewButton.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    expect(document.getElementById(hintId)).toHaveTextContent(/select at least one item/i)
    // Clicking while invalid is a no-op (focusable means clickable).
    await user.click(reviewButton)
    expect(onReview).not.toHaveBeenCalled()

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(reviewButton).toHaveAttribute('aria-disabled', 'false')
    expect(reviewButton).not.toHaveAttribute('aria-describedby')
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

test('clicking Review return forwards a properly shaped payload', async () => {
    const user = userEvent.setup()
    const onReview = jest.fn()
    renderWithProviders(<Harness onReview={onReview} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // item-2: max 1, should default-reason

    // Change reason away from default so it gets serialized
    const reason = within(screen.getAllByTestId('return-items-modal-item-row')[1]).getByLabelText(
        /reason for /i,
        {selector: 'select'}
    )
    await user.selectOptions(reason, 'Defect')

    await user.click(screen.getByTestId('return-items-modal-review'))
    expect(onReview).toHaveBeenCalledWith([{itemId: 'item-2', quantity: 1, reason: 'Defect'}])
})

test('renders skeleton placeholders while OMS metadata is loading', () => {
    mockOmsMetaData = {data: undefined, isLoading: true, isError: false, refetch: jest.fn()}
    renderWithProviders(<Harness />)
    expect(screen.getByTestId('return-items-modal-loading')).toBeInTheDocument()
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

test('renders an error alert + Retry when OMS metadata fails', async () => {
    const user = userEvent.setup()
    const refetch = jest.fn()
    mockOmsMetaData = {data: undefined, isLoading: false, isError: true, refetch}
    renderWithProviders(<Harness />)
    expect(screen.getByTestId('return-items-modal-error')).toBeInTheDocument()
    await user.click(screen.getByTestId('return-items-modal-retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
})

// Harness with a real trigger button so we can assert focus returns to it on
// close — Chakra's returnFocusOnClose restores focus to whatever was focused
// when the modal opened.
const FocusHarness = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [selection, setSelection] = useState({})
    return (
        <>
            <button data-testid="return-items-trigger" onClick={() => setIsOpen(true)}>
                Return Items
            </button>
            <ReturnItemsModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                order={baseOrder}
                returnableItems={baseOrder.productItems}
                selection={selection}
                onSelectionChange={setSelection}
                onReview={jest.fn()}
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
