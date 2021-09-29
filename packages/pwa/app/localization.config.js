/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessage} from 'react-intl'
import packageJson from '../package.json'

export const localizationConfig = {
    defaultLocale: packageJson.l10n.defaultLocale,
    supportedLocales: [
        {
            id: 'en-GB',
            message: defineMessage({defaultMessage: 'English (United Kingdom)'})
        },
        {
            id: 'fr-FR',
            message: defineMessage({defaultMessage: 'French (France)'})
        },
        {
            id: 'it-IT',
            message: defineMessage({defaultMessage: 'Italian (Italy)'})
        },
        {
            id: 'zh-CN',
            message: defineMessage({defaultMessage: 'Chinese (China)'})
        },
        {
            id: 'ja-JP',
            message: defineMessage({defaultMessage: 'Japanese (Japan)'})
        }
    ]
}
