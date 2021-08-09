/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
export default {
    baseStyle: {
        container: {style: {alignItems: 'baseline'}},
        label: {
            width: 'full'
        },
        control: {
            marginTop: '2px',
            _checked: {
                backgroundColor: 'blue.600',
                borderColor: 'blue.600',
                _hover: {
                    bg: 'blue.700',
                    borderColor: 'blue.700'
                }
            }
        }
    },
    sizes: {
        md: {
            label: {fontSize: 'sm'}
        }
    }
}
