/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineSlotRecipe} from '@chakra-ui/react'

export default defineSlotRecipe({
    className: 'listMenu',
    description: 'The visual style for the ListMenu component',
    slots: [
        'listMenuTriggerContainer',
        'listMenuTriggerLink',
        'listMenuTriggerLinkActive',
        'listMenuTriggerLinkIcon',
        'popoverContent',
        'popoverBody'
    ],
    base: {
        listMenuTriggerContainer: {
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
        },
        listMenuTriggerLink: {
            display: 'block',
            padding: 4,
            textDecoration: 'none',
            color: 'black',
            fontWeight: 'medium',
            _hover: {
                textDecoration: 'none',
                color: 'blue.600'
            }
        },
        listMenuTriggerLinkActive: {
            color: 'blue.600'
        },
        listMenuTriggerLinkIcon: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 6,
            height: 6,
            marginLeft: 1,
            color: 'gray.500',
            _hover: {
                color: 'blue.600'
            },
            cursor: 'pointer'
        },
        popoverContent: {
            backgroundColor: 'white',
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: 'md',
            boxShadow: 'lg',
            zIndex: 'dropdown',
            minWidth: '200px'
        },
        popoverBody: {
            padding: 4
        }
    },
    variants: {
        size: {
            sm: {
                listMenuTriggerLink: {
                    padding: 2,
                    fontSize: 'sm'
                },
                listMenuTriggerLinkIcon: {
                    width: 4,
                    height: 4
                }
            },
            md: {
                listMenuTriggerLink: {
                    padding: 4,
                    fontSize: 'md'
                },
                listMenuTriggerLinkIcon: {
                    width: 6,
                    height: 6
                }
            },
            lg: {
                listMenuTriggerLink: {
                    padding: 6,
                    fontSize: 'lg'
                },
                listMenuTriggerLinkIcon: {
                    width: 8,
                    height: 8
                }
            }
        }
    },
    defaultVariants: {
        size: 'md'
    }
}) 