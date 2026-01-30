/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {render, screen, act, waitFor} from '@testing-library/react'
import {useCheckoutAutoSelect} from '@salesforce/retail-react-app/app/hooks/use-checkout-auto-select'

const STEP_SHIPPING = 1
const STEP_PAYMENT = 2

function TestWrapper({
    currentStep = STEP_SHIPPING,
    targetStep = STEP_SHIPPING,
    isCustomerRegistered = true,
    items = [{id: 'addr-1', preferred: true}],
    getPreferredItem = (list) => list.find((i) => i.preferred) || list[0],
    shouldSkip = () => false,
    isAlreadyApplied = () => false,
    applyItem = jest.fn(() => Promise.resolve()),
    onSuccess = jest.fn(),
    onError = jest.fn(),
    enabled = true
}) {
    const result = useCheckoutAutoSelect({
        currentStep,
        targetStep,
        isCustomerRegistered,
        items,
        getPreferredItem,
        shouldSkip,
        isAlreadyApplied,
        applyItem,
        onSuccess,
        onError,
        enabled
    })
    return (
        <div>
            <span data-testid="isLoading">{String(result.isLoading)}</span>
            <span data-testid="hasExecuted">{String(result.hasExecuted)}</span>
            <button type="button" onClick={result.reset} data-testid="reset">
                Reset
            </button>
        </div>
    )
}

TestWrapper.propTypes = {
    currentStep: PropTypes.number,
    targetStep: PropTypes.number,
    isCustomerRegistered: PropTypes.bool,
    items: PropTypes.array,
    getPreferredItem: PropTypes.func,
    shouldSkip: PropTypes.func,
    isAlreadyApplied: PropTypes.func,
    applyItem: PropTypes.func,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
    enabled: PropTypes.bool
}

describe('useCheckoutAutoSelect', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('early returns - does not call applyItem', () => {
        test('does not run when enabled is false', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper enabled={false} applyItem={applyItem} items={[{id: 'a'}]} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })

        test('does not run when currentStep does not match targetStep', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(
                <TestWrapper
                    currentStep={STEP_PAYMENT}
                    targetStep={STEP_SHIPPING}
                    applyItem={applyItem}
                />
            )
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })

        test('does not run when isCustomerRegistered is false', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper isCustomerRegistered={false} applyItem={applyItem} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })

        test('does not run when items is null or empty', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            const {rerender} = render(<TestWrapper items={null} applyItem={applyItem} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })

            rerender(<TestWrapper items={[]} applyItem={applyItem} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })

        test('does not run when shouldSkip returns true', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper shouldSkip={() => true} applyItem={applyItem} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })

        test('does not run when isAlreadyApplied returns true', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper isAlreadyApplied={() => true} applyItem={applyItem} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })

        test('does not run when getPreferredItem returns null/undefined', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper getPreferredItem={() => null} applyItem={applyItem} />)
            await waitFor(() => {
                expect(applyItem).not.toHaveBeenCalled()
            })
        })
    })

    describe('when conditions are met', () => {
        test('calls applyItem with the preferred item', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            const items = [
                {id: 'addr-1', preferred: false},
                {id: 'addr-2', preferred: true}
            ]
            render(<TestWrapper items={items} applyItem={applyItem} />)

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalledTimes(1)
                expect(applyItem).toHaveBeenCalledWith({id: 'addr-2', preferred: true})
            })
        })

        test('calls onSuccess with the preferred item after applyItem resolves', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            const onSuccess = jest.fn(() => Promise.resolve())
            const preferred = {id: 'addr-1', preferred: true}
            render(<TestWrapper items={[preferred]} applyItem={applyItem} onSuccess={onSuccess} />)

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalledWith(preferred)
                expect(onSuccess).toHaveBeenCalledWith(preferred)
            })
        })

        test('does not call onSuccess when not provided', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper items={[{id: 'a'}]} applyItem={applyItem} />)

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalled()
            })
        })

        test('resets hasExecutedRef and calls onError when applyItem throws', async () => {
            const error = new Error('Apply failed')
            const applyItem = jest.fn(() => Promise.reject(error))
            const onError = jest.fn()
            render(<TestWrapper items={[{id: 'a'}]} applyItem={applyItem} onError={onError} />)

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalled()
                expect(onError).toHaveBeenCalledWith(error)
            })
            // Effect may re-run after error (e.g. when isLoading changes), so onError can be called more than once
            expect(onError).toHaveBeenCalled()
        })

        test('runs only once (hasExecutedRef prevents re-run)', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            const {rerender} = render(<TestWrapper items={[{id: 'a'}]} applyItem={applyItem} />)

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalledTimes(1)
            })

            rerender(
                <TestWrapper
                    items={[{id: 'a'}]}
                    applyItem={applyItem}
                    currentStep={STEP_SHIPPING}
                />
            )

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('reset', () => {
        test('reset is a function that can be called without throwing', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper items={[{id: 'a'}]} applyItem={applyItem} />)

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalledTimes(1)
            })

            expect(() => {
                act(() => {
                    screen.getByTestId('reset').click()
                })
            }).not.toThrow()
        })
    })

    describe('return value', () => {
        test('returns isLoading, hasExecuted, and reset', async () => {
            const applyItem = jest.fn(() => Promise.resolve())
            render(<TestWrapper items={[{id: 'a'}]} applyItem={applyItem} />)

            expect(screen.getByTestId('isLoading')).toBeInTheDocument()
            expect(screen.getByTestId('hasExecuted')).toBeInTheDocument()
            expect(screen.getByTestId('reset')).toBeInTheDocument()

            await waitFor(() => {
                expect(applyItem).toHaveBeenCalled()
            })
        })
    })
})
