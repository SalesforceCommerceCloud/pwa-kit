/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const productViewModalTheme = {
    // Modal configuration
    modal: {
        size: '4xl',
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
        showFullLink: false,
        imageSize: 'sm',
        showImageGallery: true
    },

    // Color scheme
    colors: {
        background: 'white',
        contentBackground: 'white'
    }
}
