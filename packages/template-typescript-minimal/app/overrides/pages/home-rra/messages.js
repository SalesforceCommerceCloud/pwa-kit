/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineMessages} from 'react-intl'
import {messages as originalMessages} from '*/pages/home-rra/messages'

let messages = defineMessages({
    'home.title.react_starter_store': {
        defaultMessage: 'The React PWA Starter Store for Retail - FOOO',
        id: 'home.title.react_starter_store'
    }
})
messages = {
    ...originalMessages,
    messages
}

export {messages}
