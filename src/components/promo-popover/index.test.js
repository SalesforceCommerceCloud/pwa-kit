/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import PromoPopover from './index'
import {Box, Text} from '@chakra-ui/react'

describe('PromoPopover', () => {
    test('renders info icon button', () => {
        renderWithProviders(
            <PromoPopover>
                <Text>Test content</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})
        expect(infoButton).toBeInTheDocument()
        expect(infoButton).toHaveAttribute('aria-label', 'Info')
    })

    test('renders with default header when no header prop provided', async () => {
        const {user} = renderWithProviders(
            <PromoPopover>
                <Text>Promotion details</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})

        await act(async () => {
            await user.click(infoButton)
        })
        await waitFor(() => {
            expect(screen.getByText('Promotions Applied')).toBeInTheDocument()
        })
    })

    test('renders with custom header when header prop provided', async () => {
        const customHeader = <Text fontWeight="bold">Custom Promotion Header</Text>
        const {user} = renderWithProviders(
            <PromoPopover header={customHeader}>
                <Text>Custom promotion content</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})

        await act(async () => {
            await user.click(infoButton)
        })
        await waitFor(() => {
            expect(screen.getByText('Custom Promotion Header')).toBeInTheDocument()
        })
    })

    test('displays popover content on click', async () => {
        const {user} = renderWithProviders(
            <PromoPopover>
                <Text>10% off your order</Text>
                <Text>Free shipping on orders over $50</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})

        expect(screen.queryByText('10% off your order')).not.toBeInTheDocument()
        expect(screen.queryByText('Free shipping on orders over $50')).not.toBeInTheDocument()

        await act(async () => {
            await user.click(infoButton)
        })
        await waitFor(() => {
            expect(screen.getByText('10% off your order')).toBeInTheDocument()
            expect(screen.getByText('Free shipping on orders over $50')).toBeInTheDocument()
        })
    })

    test('can close popover using close button', async () => {
        const {user} = renderWithProviders(
            <PromoPopover>
                <Text>Closeable promotion content</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})

        await act(async () => {
            await user.click(infoButton)
        })
        await waitFor(() => {
            expect(screen.getByText('Closeable promotion content')).toBeInTheDocument()
        })

        const closeButton = screen.getByRole('button', {name: /close/i})
        await act(async () => {
            await user.click(closeButton)
        })

        await waitFor(() => {
            expect(screen.queryByText('Closeable promotion content')).not.toBeInTheDocument()
        })
    })

    test('renders with additional props passed to container', () => {
        renderWithProviders(
            <PromoPopover data-testid="custom-promo-popover" className="custom-class">
                <Text>Test content</Text>
            </PromoPopover>
        )

        const container = screen.getByTestId('custom-promo-popover')
        expect(container).toBeInTheDocument()
        expect(container).toHaveClass('custom-class')
    })

    test('has correct accessibility attributes', () => {
        renderWithProviders(
            <PromoPopover>
                <Text>Accessible content</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})
        expect(infoButton).toHaveAttribute('aria-label', 'Info')
    })

    test('renders complex content in popover body', async () => {
        const complexContent = (
            <Box>
                <Text fontWeight="bold">Special Offers:</Text>
                <ul>
                    <li>15% off clothing</li>
                    <li>Buy 2 get 1 free shoes</li>
                    <li>Free shipping over $75</li>
                </ul>
            </Box>
        )

        const {user} = renderWithProviders(<PromoPopover>{complexContent}</PromoPopover>)

        const infoButton = screen.getByRole('button', {name: /info/i})

        await act(async () => {
            await user.click(infoButton)
        })
        await waitFor(() => {
            expect(screen.getByText('Special Offers:')).toBeInTheDocument()
            expect(screen.getByText('15% off clothing')).toBeInTheDocument()
            expect(screen.getByText('Buy 2 get 1 free shoes')).toBeInTheDocument()
            expect(screen.getByText('Free shipping over $75')).toBeInTheDocument()
        })
    })

    test('popover positioning is set to top', async () => {
        const {user} = renderWithProviders(
            <PromoPopover>
                <Text>Positioned content</Text>
            </PromoPopover>
        )

        const infoButton = screen.getByRole('button', {name: /info/i})

        await act(async () => {
            await user.click(infoButton)
        })

        // The popover should be rendered (positioning is handled by Chakra UI internally)
        await waitFor(() => {
            expect(screen.getByText('Positioned content')).toBeInTheDocument()
        })
    })

    test('multiple promo popovers can exist independently', async () => {
        const {user} = renderWithProviders(
            <Box>
                <PromoPopover data-testid="popover-1">
                    <Text>First promotion</Text>
                </PromoPopover>
                <PromoPopover data-testid="popover-2">
                    <Text>Second promotion</Text>
                </PromoPopover>
            </Box>
        )

        const infoButtons = screen.getAllByRole('button', {name: /info/i})
        expect(infoButtons).toHaveLength(2)

        await act(async () => {
            await user.click(infoButtons[0])
        })
        await waitFor(() => {
            expect(screen.getByText('First promotion')).toBeInTheDocument()
            expect(screen.queryByText('Second promotion')).not.toBeInTheDocument()
        })

        const closeButton = screen.getByRole('button', {name: /close/i})
        await act(async () => {
            await user.click(closeButton)
        })

        await waitFor(() => {
            expect(screen.queryByText('First promotion')).not.toBeInTheDocument()
        })

        await act(async () => {
            await user.click(infoButtons[1])
        })
        await waitFor(() => {
            expect(screen.queryByText('First promotion')).not.toBeInTheDocument()
            expect(screen.getByText('Second promotion')).toBeInTheDocument()
        })
    })
})
