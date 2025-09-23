/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Theme configuration for AddToCartModal and BonusProductSelectionModal
 * Centralizes modal positioning, sizing, spacing, and color values
 *
 * This theme object provides a single source of truth for:
 * - Modal size breakpoints and placement
 * - Layout spacing (padding, margins) for core sections
 * - Border styling for dividers
 * - Color scheme for backgrounds
 *
 * Usage: Import and reference theme properties instead of hardcoded values
 * Example: paddingX={addToCartModalTheme.layout.section.paddingX}
 *
 * To customize: Modify values in this theme object rather than individual components
 * Example: Change modal.size to {base: 'lg', lg: 'xl', xl: '2xl'} for larger modals
 */
export const addToCartModalTheme = {
    // Modal configuration
    modal: {
        size: {base: 'full', lg: '2xl', xl: '4xl'},
        placement: 'center',
        scrollBehavior: 'inside'
    },

    // Layout spacing and positioning
    layout: {
        content: {
            margin: '0',
            borderRadius: {base: 'none', md: 'base'},
            maxHeight: 'auto',
            overflowY: 'visible'
        },
        header: {
            paddingY: 8,
            borderTopRadius: {base: 'none', md: 'lg'},
            borderBottom: '1px',
            borderColor: 'gray.200'
        },
        body: {
            padding: 6,
            marginBottom: {base: 40, lg: 0}
        },
        mainContainer: {
            flexDirection: {base: 'column', lg: 'row'},
            paddingBottom: {base: '0', lg: '8'},
            paddingX: '4'
        },
        section: {
            paddingX: {lg: '4', xl: '8'},
            paddingY: {base: '4', lg: '0'}
        },
        divider: {
            borderRightWidth: {lg: '1px'},
            borderColor: 'gray.200',
            borderStyle: 'solid'
        },
        footer: {
            position: 'fixed',
            width: '100%',
            display: ['block', 'block', 'block', 'none'],
            padding: [4, 4, 6],
            left: 0,
            bottom: 0
        }
    },

    // Color scheme
    colors: {
        background: 'gray.50',
        contentBackground: 'white',
        dividerColor: 'gray.200'
    }
}
