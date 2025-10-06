/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Fiorivia Fashion Theme - Button Styles
export default {
    baseStyle: {
        borderRadius: 'base'
    },
    variants: {
        solid: (props) => {
            // Fiorivia primary color (dark/black)
            if (props.colorScheme === 'gray' || props.colorScheme === 'black') {
                return {
                    backgroundColor: 'gray.800',
                    color: 'white',
                    _hover: {bg: 'gray.900', _disabled: {bg: 'gray.300'}},
                    _active: {bg: 'gray.900'},
                    _disabled: {bg: 'gray.300'}
                }
            }
            // Blue variant for secondary actions
            if (props.colorScheme === 'blue') {
                return {
                    backgroundColor: 'blue.600',
                    color: 'white',
                    _hover: {bg: 'blue.700', _disabled: {bg: 'blue.300'}},
                    _active: {bg: 'blue.800'},
                    _disabled: {bg: 'blue.300'}
                }
            }
            return {}
        },
        outline: (props) =>
            props.colorScheme === 'black'
                ? {color: 'gray.900', _hover: {bg: 'gray.50'}, borderColor: 'gray.200'}
                : {color: 'gray.800', _hover: {bg: 'gray.50'}},
        footer: {
            fontSize: 'sm',
            backgroundColor: 'gray.100',
            color: 'black',
            _hover: {bg: 'gray.200'},
            _active: {bg: 'gray.300'},
            paddingLeft: 3,
            paddingRight: 3
        },
        link: (props) => ({
            color: props.colorScheme === 'red' ? 'red.500' : 'gray.800',
            fontWeight: 'normal',
            minWidth: '1em',
            lineHeight: 4
        }),
        'menu-link': {
            color: 'black',
            justifyContent: 'flex-start',
            fontSize: 'sm',
            _hover: {bg: 'gray.50', textDecoration: 'underline', textDecorationColor: 'gray.900'},
            _activeLink: {
                bg: 'gray.50',
                borderLeft: 'solid',
                borderLeftColor: 'gray.600',
                borderLeftWidth: '4px'
            }
        },
        'menu-link-mobile': {
            color: 'black',
            justifyContent: 'flex-start',
            fontSize: 'sm',
            _hover: {bg: 'gray.50', textDecoration: 'underline', textDecorationColor: 'gray.900'},
            _activeLink: {
                bg: 'gray.100',
                border: 'solid',
                borderColor: 'gray.600',
                borderWidth: '1px'
            }
        },
        'search-link': {
            color: 'black',
            justifyContent: 'flex-start',
            fontSize: 'sm',
            _hover: {textDecoration: 'none'}
        }
    },
    sizes: {
        md: {
            height: 11,
            minWidth: 11
        }
    },
    defaultProps: {
        colorScheme: 'gray' // Fiorivia primary color
    }
}
