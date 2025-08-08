/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Theme configuration for ProductViewModal and BonusProductViewModal
 * Centralizes modal positioning, sizing, spacing, and color values for product view modals
 *
 * This theme object provides a single source of truth for:
 * - Modal size breakpoints and placement optimized for product viewing
 * - Layout spacing (padding, margins) for product content
 * - Color scheme for backgrounds
 * - Content constraints to prevent excessive height
 *
 * Usage: Import and reference theme properties instead of hardcoded values
 * Example: size={productViewModalTheme.modal.size}
 *
 * To customize: Modify values in this theme object rather than individual components
 * Example: Change modal.size to {base: 'full', lg: 'md', xl: 'lg'} for smaller modals
 */
export const productViewModalTheme = {
    // Modal configuration
    modal: {
        size: {base: 'full', lg: 'lg', xl: 'xl'},
        placement: 'center',
        scrollBehavior: 'inside',
        closeOnInteractOutside: false
    },

    // Layout spacing and positioning
    layout: {
        content: {
            // No margin for full utilization of modal space
            margin: '0',
            borderRadius: {base: 'none', md: 'base'},
            // Constrain height to prevent excessive modal size
            maxHeight: '85vh',
            overflowY: 'auto'
        },
        body: {
            // Adequate padding for product content
            padding: 6,
            paddingBottom: 8,
            marginTop: 6,
            // White background for product content
            background: 'white'
        }
    },

    // ProductView component configuration
    productView: {
        showFullLink: true,
        imageSize: 'sm',
        showImageGallery: true
    },

    // Color scheme
    colors: {
        background: 'white',
        contentBackground: 'white'
    }
}
