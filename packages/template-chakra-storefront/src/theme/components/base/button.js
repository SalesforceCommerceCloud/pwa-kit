/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

const baseLinkStyles = {
    fontWeight: 'normal',
    minWidth: '1em',
    height: 'auto',
    padding: '0',
    _hover: {
        // Copied from the original recipe of Chakra's Link
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        textDecorationColor: 'currentColor/20'
    }
}

const button = defineRecipe({
    base: {
        borderRadius: 'sm',
        colorPalette: 'blue'
    },
    variants: {
        variant: {
            solid: {
                backgroundColor: 'colorPalette.600',
                color: 'white',
                _hover: {bg: 'colorPalette.700', _disabled: {bg: 'colorPalette.300'}},
                _active: {bg: 'colorPalette.800'},
                _disabled: {bg: 'colorPalette.300'}
            },
            'outline-black': {
                color: 'gray.900',
                _hover: {bg: 'gray.50'},
                borderColor: 'gray.200'
            },
            outline: {
                color: 'blue.600',
                _hover: {bg: 'gray.50'}
            },
            'outline-gray': {
                borderColor: 'gray.200',
                _hover: {bg: 'gray.50'}
            },
            footer: {
                fontSize: 'sm',
                backgroundColor: 'gray.100',
                color: 'black',
                _hover: {bg: 'gray.200'},
                _active: {bg: 'gray.300'},
                paddingLeft: 3,
                paddingRight: 3
            },
            sm: {
                height: 9,
                minWidth: 11,
                textStyle: 'sm'
            },
            'link-red': {
                ...baseLinkStyles,
                color: 'red.500'
            },
            'link-blue': {
                ...baseLinkStyles,
                color: 'blue.600'
            },
            'menu-link': {
                width: '100%',
                color: 'black',
                justifyContent: 'flex-start',
                fontSize: 'sm',
                _hover: {
                    bg: 'gray.50',
                    textDecoration: 'underline',
                    textDecorationColor: 'gray.900'
                },
                '&.active': {
                    bg: 'gray.50',
                    borderLeft: 'solid',
                    borderLeftColor: 'gray.600',
                    borderLeftWidth: '4px'
                }
            },
            'menu-link-mobile': {
                width: '100%',
                color: 'black',
                justifyContent: 'flex-start',
                fontSize: 'sm',
                _hover: {
                    bg: 'gray.50',
                    textDecoration: 'underline',
                    textDecorationColor: 'gray.900'
                },
                '&.active': {
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
        size: {
            md: {
                height: 11,
                minWidth: 11,
                textStyle: 'md'
            }
        }
    }
})

export default button
