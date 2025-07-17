/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    parts: [
        'container',
        'name',
        'addressLine',
        'distance',
        'email',
        'phone',
        'storeHoursContainer',
        'accordionButton',
        'accordionPanel',
        'storeHoursContent'
    ],
    baseStyle: {
        container: {},
        name: {
            fontSize: 'md',
            fontWeight: 'bold'
        },
        addressLine: {
            color: 'gray.600'
        },
        distance: {
            color: 'gray.600'
        },
        email: {
            color: 'gray.600'
        },
        phone: {
            color: 'gray.600'
        },
        storeHoursContainer: {
            mt: 2
        },
        accordionButton: {
            px: 0,
            py: 1,
            color: 'blue.700',
            fontSize: 'sm',
            fontWeight: 'semibold',
            _hover: {
                bg: 'transparent'
            }
        },
        accordionPanel: {
            px: 0,
            pb: 2
        },
        storeHoursContent: {
            color: 'gray.600'
        }
    },
    sizes: {
        xs: {
            addressLine: {fontSize: 'xs'},
            distance: {fontSize: 'xs'},
            email: {fontSize: 'xs'},
            phone: {fontSize: 'xs'},
            storeHoursContent: {fontSize: 'xs'}
        },
        sm: {
            addressLine: {fontSize: 'sm'},
            distance: {fontSize: 'sm'},
            email: {fontSize: 'sm'},
            phone: {fontSize: 'sm'},
            storeHoursContent: {fontSize: 'sm'}
        },
        md: {
            addressLine: {fontSize: 'md'},
            distance: {fontSize: 'md'},
            email: {fontSize: 'md'},
            phone: {fontSize: 'md'},
            storeHoursContent: {fontSize: 'md'}
        },
        lg: {
            addressLine: {fontSize: 'lg'},
            distance: {fontSize: 'lg'},
            email: {fontSize: 'lg'},
            phone: {fontSize: 'lg'},
            storeHoursContent: {fontSize: 'lg'}
        }
    },
    defaultProps: {
        size: 'sm'
    }
} 