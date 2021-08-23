/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: () => ({
        swatchGroup: {
            flexDirection: 'column '
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
            _disabled: {
                opacity: 1
            }
        }
    }),
    variants: {
        circle: (props) => ({
            swatch: {
                height: 11,
                width: 11,
                borderRadius: 'full',
                padding: 1,
                cursor: 'pointer',
                marginRight: 2,
                marginLeft: 0,
                marginBottom: 2,
                color: `${props.selected ? 'black' : 'gray.200'}`,
                border: `${props.selected ? '1px' : '0'}`,
                _hover: {
                    borderColor: `${props.selected ? 'black' : 'gray.200'}`,
                    borderWidth: 1,
                    borderStyle: 'solid'
                },
                _active: {
                    background: 'transparent'
                },
                _before: {
                    content: '""',
                    display: `${props.disabled ? 'block' : 'none'}`,
                    position: 'absolute',
                    height: 11,
                    width: '1px',
                    transform: 'rotate(45deg)',
                    backgroundColor: 'black',
                    zIndex: 1
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
        }),
        square: (props) => ({
            swatch: {
                marginRight: 2,
                // diagonal line for disabled options
                // theme variable like gray.200 won't work inside linear-gradient
                backgroundImage: `${
                    props.disabled
                        ? `${
                              props.selected
                                  ? 'linear-gradient(to top left, transparent calc(50% - 1px), black, transparent calc(50% + 1px) )'
                                  : 'linear-gradient(to top left, white calc(50% - 1px), #c9c9c9, white calc(50% + 1px) )'
                          } `
                        : ''
                }`,
                borderColor: `${props.selected ? 'black' : 'gray.200'}`,
                borderStyle: 'solid',
                borderWidth: 1,
                paddingLeft: 3,
                paddingRight: 3,
                marginBottom: 2,
                _focus: {outline: 'none'},
                _hover: {
                    textDecoration: 'none',
                    borderColor: 'gray.900'
                },
                _active: {
                    borderColor: 'gray.900'
                },
                backgroundColor: `${
                    props.selected ? (props.disabled ? 'gray.100' : 'black') : 'white'
                }`,
                color: `${props.selected && !props.disabled ? 'white' : 'gray.900'}`
            },
            swatchButton: {}
        })
    },
    parts: ['swatch', 'swatchItem']
}
