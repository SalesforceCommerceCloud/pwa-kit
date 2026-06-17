/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {fireEvent, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ReturnOrderModal from '@salesforce/retail-react-app/app/components/return-order-modal'
import {buildReturnPayload} from '@salesforce/retail-react-app/app/components/return-order-modal/constants'

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
        <ReturnOrderModal
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
})

test('renders header with order number and a row per returnable item', async () => {
    renderWithProviders(<Harness />)
    expect(await screen.findByText(/return items from order #00123456/i)).toBeInTheDocument()
    expect(screen.getByText(/select the items you want to return/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('return-modal-item-row')).toHaveLength(2)
    expect(screen.getByText(/cotton crew t-shirt/i)).toBeInTheDocument()
    expect(screen.getByText(/slim fit chino pants/i)).toBeInTheDocument()
})

test('Review return is disabled until at least one valid row is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const reviewButton = screen.getByTestId('return-modal-review')
    expect(reviewButton).toBeDisabled()
    expect(reviewButton).toHaveAttribute('aria-describedby')

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(reviewButton).toBeEnabled()
    expect(reviewButton).not.toHaveAttribute('aria-describedby')
})

test('toggling a row expands it and pre-selects the OMS default reason', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    const row = screen.getAllByTestId('return-modal-item-row')[0]
    expect(within(row).getByLabelText(/reason/i)).toHaveValue('Wrong size')
    expect(within(row).getByLabelText(/quantity/i)).toHaveValue('1')
})

test('quantity field clamps to the available-to-return ceiling', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0]) // item-1 has max 2

    const row = screen.getAllByTestId('return-modal-item-row')[0]
    const qty = within(row).getByLabelText(/quantity/i)
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
    await user.click(screen.getByTestId('return-modal-cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
})

test('clicking Review return forwards a properly shaped payload', async () => {
    const user = userEvent.setup()
    const onReview = jest.fn()
    renderWithProviders(<Harness onReview={onReview} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // item-2: max 1, should default-reason

    // Change reason away from default so it gets serialized
    const reason = within(screen.getAllByTestId('return-modal-item-row')[1]).getByLabelText(
        /reason/i
    )
    await user.selectOptions(reason, 'Defect')

    await user.click(screen.getByTestId('return-modal-review'))
    expect(onReview).toHaveBeenCalledWith([{itemId: 'item-2', quantity: 1, reason: 'Defect'}])
})

test('omits reason from payload when shopper kept the OMS default', () => {
    const selection = {'item-2': {checked: true, quantity: 1, reasonCode: 'Wrong size'}}
    expect(buildReturnPayload(selection, 'Wrong size')).toEqual([{itemId: 'item-2', quantity: 1}])
})

test('serializes quantity as a JS Number (not a string)', () => {
    const selection = {'item-2': {checked: true, quantity: '3', reasonCode: 'Defect'}}
    const [row] = buildReturnPayload(selection, 'Wrong size')
    expect(typeof row.quantity).toBe('number')
    expect(row.quantity).toBe(3)
})

test('renders skeleton placeholders while OMS metadata is loading', () => {
    mockOmsMetaData = {data: undefined, isLoading: true, isError: false, refetch: jest.fn()}
    renderWithProviders(<Harness />)
    expect(screen.getByTestId('return-modal-loading')).toBeInTheDocument()
})

test('renders an error alert + Retry when OMS metadata fails', async () => {
    const user = userEvent.setup()
    const refetch = jest.fn()
    mockOmsMetaData = {data: undefined, isLoading: false, isError: true, refetch}
    renderWithProviders(<Harness />)
    expect(screen.getByTestId('return-modal-error')).toBeInTheDocument()
    await user.click(screen.getByTestId('return-modal-retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
})
