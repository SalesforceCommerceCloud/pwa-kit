/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineRecipe} from '@chakra-ui/react'

const mdSize = {height: 11, borderRadius: 'sm'}

export default defineRecipe({
    base: {
        field: {
            _focus: {
                borderColor: 'blue.600'
            }
        }
    },
    variants: {
        variant: {
            outline: {
                field: {
                    borderColor: 'gray.500'
                }
            },
            filled: {
                // we use filled variant for
                // search input
                field: {
                    borderColor: 'gray.600',
                    backgroundColor: 'gray.100',
                    _focus: {
                        backgroundColor: 'white'
                    },
                    _hover: {
                        backgroundColor: 'gray.100',
                        _focus: {
                            backgroundColor: 'white'
                        }
                    },
                    _placeholder: {
                        color: 'gray.700'
                    }
                }
            }
        },
        size: {
            md: {
                ...mdSize,
                px: 3
            }
        }
    }
})
