/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
const mdSize = {height: 11, borderRadius: 'base'}

export default {
    sizes: {
        md: {
            field: {...mdSize, px: 3},
            addon: mdSize
        }
    },
    baseStyle: {
        field: {
            _focus: {
                borderColor: 'blue.600'
            }
        }
    },
    variants: {
        filled: {
            // we use filled variant for
            // search input
            field: {
                backgroundColor: 'gray.50',
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
    }
}
