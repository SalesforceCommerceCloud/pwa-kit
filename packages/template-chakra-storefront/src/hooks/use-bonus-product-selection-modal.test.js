/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, act} from '@testing-library/react'
import {renderWithChakraProvider} from '../utils/test-utils'
import {
    useBonusProductSelectionModal,
    BonusProductSelectionModalProvider,
    useBonusProductSelectionModalContext
} from './use-bonus-product-selection-modal'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useLocation: () => ({pathname: '/test'})
}))

const BonusProductSelectionModalTest = () => {
    const {isOpen, onOpen, onClose, data} = useBonusProductSelectionModalContext()

    return (
        <div>
            <div data-testid="is-open">{isOpen.toString()}</div>
            <div data-testid="data">{JSON.stringify(data)}</div>
            <button onClick={() => onOpen({test: 'data'})} data-testid="open-button">
                Open Modal
            </button>
            <button onClick={onClose} data-testid="close-button">
                Close Modal
            </button>
        </div>
    )
}

describe('useBonusProductSelectionModal', () => {
    it('should provide initial state', () => {
        const TestHook = () => {
            const modal = useBonusProductSelectionModal()
            return (
                <div>
                    <div data-testid="is-open">{modal.isOpen.toString()}</div>
                    <div data-testid="data">{JSON.stringify(modal.data)}</div>
                </div>
            )
        }

        renderWithChakraProvider(<TestHook />)

        expect(screen.getByTestId('is-open')).toHaveTextContent('false')
        expect(screen.getByTestId('data')).toHaveTextContent('null')
    })

    it('should open modal with data', async () => {
        renderWithChakraProvider(
            <BonusProductSelectionModalProvider>
                <BonusProductSelectionModalTest />
            </BonusProductSelectionModalProvider>
        )

        const openButton = screen.getByTestId('open-button')
        await act(async () => {
            openButton.click()
        })

        expect(screen.getByTestId('is-open')).toHaveTextContent('true')
        expect(screen.getByTestId('data')).toHaveTextContent('{"test":"data"}')
    })

    it('should close modal', async () => {
        renderWithChakraProvider(
            <BonusProductSelectionModalProvider>
                <BonusProductSelectionModalTest />
            </BonusProductSelectionModalProvider>
        )

        const openButton = screen.getByTestId('open-button')
        const closeButton = screen.getByTestId('close-button')

        await act(async () => {
            openButton.click()
        })
        expect(screen.getByTestId('is-open')).toHaveTextContent('true')

        await act(async () => {
            closeButton.click()
        })
        expect(screen.getByTestId('is-open')).toHaveTextContent('false')
        expect(screen.getByTestId('data')).toHaveTextContent('null')
    })
})
