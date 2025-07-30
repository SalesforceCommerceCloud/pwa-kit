/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Centralized ListMenu styles (colors and fonts)
export const listMenuStyles = {
    // Primary navigation styles
    primary: {
        default: {
            color: 'blue.600',
            fontSize: 'md',
            fontWeight: 700
        },
        hover: {
            color: 'gray.900',
            fontSize: 'md',
            fontWeight: 700
        },
        active: {
            color: 'gray.900',
            fontSize: 'md',
            fontWeight: 700
        }
    },

    // Secondary navigation styles
    secondary: {
        default: {
            color: 'gray.700',
            fontSize: 'sm',
            fontWeight: 600
        },
        hover: {
            color: 'gray.700',
            fontSize: 'sm',
            fontWeight: 600
        },
        active: {
            color: 'gray.700',
            fontSize: 'sm',
            fontWeight: 600
        }
    },

    // Dropdown menu styles
    dropdown: {
        background: 'white',
        text: {
            color: 'gray.900',
            fontSize: 'md',
            fontWeight: 400
        },
        hover: {
            background: 'gray.50',
            color: 'gray.900',
            fontSize: 'md',
            fontWeight: 400
        }
    },

    // Icon styles
    icons: {
        chevron: {
            color: 'gray.900',
            fontSize: 'sm'
        },
        chevronHover: {
            color: 'gray.700',
            fontSize: 'sm'
        }
    },

    // Active state styles
    active: {
        underline: {
            backgroundColor: 'black',
            height: '2px'
        },
        background: 'transparent'
    }
}

// Legacy export for backward compatibility
export const listMenuColors = {
    primary: {
        default: listMenuStyles.primary.default.color,
        hover: listMenuStyles.primary.hover.color,
        active: listMenuStyles.primary.active.color
    },
    secondary: {
        default: listMenuStyles.secondary.default.color,
        hover: listMenuStyles.secondary.hover.color,
        active: listMenuStyles.secondary.active.color
    },
    dropdown: {
        background: listMenuStyles.dropdown.background,
        text: listMenuStyles.dropdown.text.color,
        hover: listMenuStyles.dropdown.hover.background
    },
    icons: {
        chevron: listMenuStyles.icons.chevron.color,
        chevronHover: listMenuStyles.icons.chevronHover.color
    },
    active: {
        underline: listMenuStyles.active.underline.backgroundColor,
        background: listMenuStyles.active.background
    }
}

export default listMenuStyles
