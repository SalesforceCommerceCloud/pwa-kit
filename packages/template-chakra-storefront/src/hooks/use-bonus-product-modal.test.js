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
    useBonusProductModal,
    BonusProductModalProvider,
    useBonusProductModalContext
} from './use-bonus-product-modal'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useLocation: () => ({pathname: '/test'})
}))

const BonusProductSelectionModal = () => {
    const {isOpen, onOpen, onClose, data} = useBonusProductModalContext()

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

describe('useBonusProductModal', () => {
    it('should provide initial state', () => {
        const TestHook = () => {
            const modal = useBonusProductModal()
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
            <BonusProductModalProvider>
                <BonusProductSelectionModal />
            </BonusProductModalProvider>
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
            <BonusProductModalProvider>
                <BonusProductSelectionModal />
            </BonusProductModalProvider>
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
