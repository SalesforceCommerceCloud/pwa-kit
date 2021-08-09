/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
export default {
    variants: {
        subtle: (props) => ({
            container: {
                borderColor: `${props.colorScheme || 'green'}.600`,
                borderWidth: 1,
                borderStyle: 'solid'
            }
        })
    }
}
