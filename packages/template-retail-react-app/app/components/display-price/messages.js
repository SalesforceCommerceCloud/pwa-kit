/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessages} from 'react-intl'

const messages = defineMessages({
    // price display
    currentPriceWithRange: {
        id: 'display_price.label.current_price_with_range',
        defaultMessage: 'From {currentPrice}'
    },
    // aria-label
    ariaLabelCurrentPrice: {
        id: 'display_price.assistive_msg.current_price',
        defaultMessage: `current price {currentPrice}`
    },
    ariaLabelCurrentPriceWithRange: {
        id: 'display_price.assistive_msg.current_price_with_range',
        defaultMessage: `From current price {currentPrice}`
    },
    ariaLabelListPrice: {
        id: 'display_price.assistive_msg.strikethrough_price',
        defaultMessage: `original price {listPrice}`
    },
    ariaLabelListPriceWithRange: {
        id: 'display_price.assistive_msg.strikethrough_price_with_range',
        defaultMessage: `From original price {listPrice}`
    }
})

export default messages
