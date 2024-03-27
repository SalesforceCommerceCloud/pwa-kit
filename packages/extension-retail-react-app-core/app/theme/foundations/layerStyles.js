/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const card = {
    py: 6,
    px: 4,
    backgroundColor: 'white',
    rounded: 'base',
    boxShadow: 'base'
}

const cardBordered = {
    ...card,
    px: [4, 4, 5, 6],
    border: '1px solid',
    borderColor: 'gray.50'
}

export default {
    card,

    cardBordered,

    ccIcon: {
        width: '34px',
        height: '22px'
    },

    page: {
        px: [4, 4, 6, 6, 8],
        paddingTop: [4, 4, 6, 6, 8],
        paddingBottom: 32,
        width: '100%',
        maxWidth: 'container.xxxl',
        marginLeft: 'auto',
        marginRight: 'auto'
    }
}
