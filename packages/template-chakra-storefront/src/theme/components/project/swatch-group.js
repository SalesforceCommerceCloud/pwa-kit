/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    slots: ['swatchGroup', 'swatchLabel', 'swatch', 'swatchesWrapper', 'swatchButton'],
    base: {
        swatchGroup: {
            flexDirection: 'column'
        },
        swatchLabel: {
            marginBottom: 3
        },
        swatch: {
            position: 'relative',
            backgroundColor: 'white',
            _focus: {
                outline: 'none',
                boxShadow: 'outline'
            }
        },
        swatchesWrapper: {
            flexWrap: 'wrap'
        },
        swatchButton: {
            borderColor: 'gray.200',
            '&[data-state="disabled"]': {
                opacity: 1
            }
        }
    },
    variants: {
        variant: {
            circle: {
                swatch: {
                    height: 11,
                    width: 11,
                    borderRadius: 'full',
                    padding: 1,
                    cursor: 'pointer',
                    marginRight: 2,
                    marginLeft: 0,
                    marginBottom: 2,
                    color: 'gray.200',
                    border: '0',
                    _hover: {
                        borderColor: 'gray.200',
                        borderWidth: 1,
                        borderStyle: 'solid'
                    },
                    _active: {
                        background: 'transparent'
                    },
                    _before: {
                        content: '""',
                        display: 'none',
                        position: 'absolute',
                        height: 11,
                        width: '1px',
                        transform: 'rotate(45deg)',
                        backgroundColor: 'black',
                        zIndex: 1
                    },
                    '&[data-state="selected"]': {
                        color: 'black',
                        border: '1px solid',
                        borderColor: 'black',
                        _hover: {
                            borderColor: 'black'
                        }
                    },
                    '&[data-state="disabled"]': {
                        _before: {
                            display: 'block'
                        }
                    }
                },
                swatchButton: {
                    height: 8,
                    borderColor: 'gray.200',
                    width: 8,
                    overflow: 'hidden',
                    borderRadius: 'full',
                    minWidth: 'auto',
                    opacity: 1,
                    _focus: {
                        outline: 'none'
                    }
                }
            },
            square: {
                swatch: {
                    marginRight: 2,
                    borderColor: 'gray.200',
                    borderStyle: 'solid',
                    borderWidth: 1,
                    paddingLeft: 3,
                    paddingRight: 3,
                    marginBottom: 2,
                    _focus: {
                        outline: 'none'
                    },
                    _hover: {
                        textDecoration: 'none',
                        borderColor: 'gray.900'
                    },
                    _active: {
                        borderColor: 'gray.900'
                    },
                    backgroundColor: 'white',
                    color: 'gray.900',
                    '&[data-state="selected"]': {
                        backgroundColor: 'black',
                        color: 'white',
                        borderColor: 'black',
                        _hover: {
                            borderColor: 'black'
                        }
                    },
                    // diagonal line for disabled options
                    // theme variable like gray.200 won't work inside linear-gradient
                    '&[data-state="disabled"]': {
                        backgroundImage:
                            'linear-gradient(to top left, white calc(50% - 1px), #c9c9c9, white calc(50% + 1px))',
                        '&[data-state="selected"]': {
                            backgroundColor: 'gray.100',
                            backgroundImage:
                                'linear-gradient(to top left, transparent calc(50% - 1px), black, transparent calc(50% + 1px))'
                        }
                    }
                },
                swatchButton: {}
            }
        }
    }
})
